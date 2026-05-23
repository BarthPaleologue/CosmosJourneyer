//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import "@babylonjs/core/Engines/Extensions/engine.query";

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { type Material } from "@babylonjs/core/Materials/material";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { VertexData, type TransformNode } from "@babylonjs/core/Meshes";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsShapeMesh, type PhysicsShape } from "@babylonjs/core/Physics/v2/physicsShape";
import { type Scene } from "@babylonjs/core/scene";
import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { type TelluricPlanetModel, type TelluricSatelliteModel } from "@cosmos-journeyer/universe-model";

import { type Cullable } from "@/frontend/helpers/cullable";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { CollisionMask, Settings } from "@/settings";

import type { ChunkForgeCompletedOutput, ChunkId } from "./chunkForge";
import { type ChunkIndices } from "./chunkIndices";
import { getQuaternionFromFaceIndex, type FaceIndex } from "./faceIndex";
import { type LodUpdateContext } from "./lodUpdateContext";
import type { IScatteringSystem } from "./scatteringSystem";

type ChunkLodMetrics = {
    readonly centerPlanetSpace: Vector3;
    readonly radiusPlanetSpace: number;
    readonly error: number;
};

export class TerrainChunkMesh implements Transformable, HasBoundingSphere, Cullable {
    readonly id: ChunkId;
    private readonly mesh: Mesh;
    public readonly indices: DeepReadonly<ChunkIndices>;
    public readonly positionOnCube: Vector3;
    private readonly positionOnSphere: Vector3;

    private readonly sideLength: number;

    private loaded = false;

    private readonly parent: TransformNode;

    private physicsShape: PhysicsShape | null = null;
    private physicsBody: PhysicsBody | null = null;

    private lodMetrics: ChunkLodMetrics | null = null;

    private disposed = false;

    private activeForLOD = true;
    private activeForCulling = true;

    private readonly scatteringSystem: IScatteringSystem;

    constructor(
        indices: ChunkIndices,
        faceIndex: FaceIndex,
        parentTransform: TransformNode,
        material: Material,
        planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
        scatteringSystem: IScatteringSystem,
        scene: Scene,
    ) {
        this.id = `${parentTransform.name}->f${faceIndex}->l${indices.lod}-x${indices.x}-y${indices.y}`;

        this.indices = structuredClone(indices);

        this.sideLength = (2 * planetModel.radius) / 2 ** this.indices.lod;

        this.mesh = new Mesh(this.id, scene);
        this.mesh.setEnabled(false);
        this.mesh.material = material;
        this.mesh.parent = parentTransform;

        this.parent = parentTransform;

        const faceRotation = getQuaternionFromFaceIndex(faceIndex);
        this.positionOnCube = new Vector3(
            -planetModel.radius + (this.indices.x + 0.5) * this.sideLength,
            -planetModel.radius + (this.indices.y + 0.5) * this.sideLength,
            -planetModel.radius,
        ).applyRotationQuaternionInPlace(faceRotation);

        this.positionOnSphere = this.positionOnCube.normalizeToNew().scaleInPlace(planetModel.radius);
        this.getTransform().position = this.positionOnSphere;

        // Node material hack: we store the planet-space position of the chunk in the instance color for easy access from Babylon NodeMaterial
        this.mesh.registerInstancedBuffer("instanceColor", 4);
        this.mesh.instancedBuffers["instanceColor"] = new Color4(
            this.positionOnSphere.x,
            this.positionOnSphere.y,
            this.positionOnSphere.z,
            1,
        );

        this.scatteringSystem = scatteringSystem;
    }

    public getTransform(): TransformNode {
        return this.mesh;
    }

    /**
     * Initializes the chunk with the given vertex data. Scatters instances on the chunk based on the given scattered point buffer.
     * @param forgeOutput the vertex data and scattered point buffer to initialize the chunk with
     */
    public init(forgeOutput: ChunkForgeCompletedOutput) {
        if (this.hasBeenDisposed()) {
            console.error(`Tried to init ${this.mesh.name} but it has been disposed`);
            return;
        }

        const vertexData = new VertexData();
        vertexData.positions = forgeOutput.positions;
        vertexData.normals = forgeOutput.normals;
        vertexData.indices = forgeOutput.indices;
        vertexData.applyToMesh(this.mesh, false);
        this.mesh.freezeNormals();

        this.lodMetrics = this.computeLodMetrics(forgeOutput.positions);

        if (this.sideLength / (Settings.VERTEX_RESOLUTION - 1) <= Settings.MAX_DISTANCE_BETWEEN_PHYSICS_VERTICES) {
            const scene = this.mesh.getScene();

            this.physicsShape = new PhysicsShapeMesh(this.mesh, scene);
            this.physicsShape.material.friction = 2;
            this.physicsShape.material.restitution = 0;
            this.physicsShape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            this.physicsShape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;

            this.physicsBody = TerrainChunkMesh.CreatePhysicsBody(this.mesh, this.physicsShape, scene);
        }

        this.mesh.receiveShadows = true;
        this.loaded = true;
        this.updateEnabledState();

        this.mesh.computeWorldMatrix(true);

        this.scatteringSystem.scatterInChunk(this.mesh, forgeOutput.scatteredInstances);
    }

    private computeLodMetrics(positions: Float32Array): ChunkLodMetrics {
        const rowVertexCount = Settings.VERTEX_RESOLUTION;
        const lastRowVertexIndex = rowVertexCount - 1;
        const lastColumnVertexIndex = rowVertexCount * (rowVertexCount - 1);
        const lastVertexIndex = rowVertexCount * rowVertexCount - 1;

        const corners = [
            Vector3.FromArray(positions),
            Vector3.FromArray(positions, lastRowVertexIndex * 3),
            Vector3.FromArray(positions, lastColumnVertexIndex * 3),
            Vector3.FromArray(positions, lastVertexIndex * 3),
        ] as const;

        for (const corner of corners) {
            corner.addInPlace(this.positionOnSphere);
        }

        const center = corners[0].add(corners[1]).add(corners[2]).add(corners[3]).scaleInPlace(0.25);

        let radius = 0;
        for (const corner of corners) {
            radius = Math.max(radius, Vector3.Distance(center, corner));
        }

        const edgeLength = Math.sqrt(
            Math.max(
                Vector3.DistanceSquared(corners[0], corners[1]),
                Vector3.DistanceSquared(corners[1], corners[3]),
                Vector3.DistanceSquared(corners[3], corners[2]),
                Vector3.DistanceSquared(corners[2], corners[0]),
            ),
        );
        const sphereRadius = this.positionOnSphere.length();
        // Sagitta approximation: the spherical patch bows beyond the straight edge chord.
        const curvaturePadding = (edgeLength * edgeLength) / (8 * sphereRadius);
        radius += curvaturePadding;

        return {
            centerPlanetSpace: center,
            radiusPlanetSpace: radius,
            error: (2 * this.sideLength) / (rowVertexCount - 1),
        };
    }

    /**
     * When the chunk has a Havok body, parenting is ignored so this method must be called to compensate.
     * If the chunk has no Havok body, this method does nothing
     */
    public updatePosition() {
        if (this.physicsBody === null) return;
        this.getTransform().setAbsolutePosition(
            Vector3.TransformCoordinates(this.positionOnSphere, this.parent.getWorldMatrix()),
        );
    }

    public getBoundingRadius(): number {
        return this.sideLength / 2;
    }

    /**
     * Returns true if the chunk is ready to be enabled (i.e if the chunk has recieved its vertex data)
     * @returns true if the chunk is ready to be enabled (i.e if the chunk has recieved its vertex data)
     */
    public isLoaded() {
        return this.loaded;
    }

    public canBeSubdivided(): boolean {
        return this.loaded && this.activeForLOD && this.activeForCulling;
    }

    public computeScreenSpaceError(lodContext: LodUpdateContext): number {
        if (this.lodMetrics === null) {
            return 0;
        }

        const distance =
            Vector3.Distance(lodContext.cameraPositionPlanetSpace, this.lodMetrics.centerPlanetSpace) -
            this.lodMetrics.radiusPlanetSpace;

        return (this.lodMetrics.error * lodContext.projectionScale) / Math.max(1e-3, distance);
    }

    public setActiveForLOD(active: boolean): void {
        this.activeForLOD = active;
        this.updateEnabledState();
    }

    private setActiveForCulling(active: boolean): void {
        this.activeForCulling = active;
        this.updateEnabledState();
    }

    private updateEnabledState(): void {
        this.mesh.setEnabled(this.loaded && this.activeForLOD && this.activeForCulling);

        if (!this.mesh.isEnabled() && this.physicsBody !== null) {
            this.physicsBody.dispose();
            this.physicsBody = null;
        } else if (this.mesh.isEnabled() && this.physicsShape !== null && this.physicsBody === null) {
            const scene = this.mesh.getScene();

            this.physicsBody = TerrainChunkMesh.CreatePhysicsBody(this.mesh, this.physicsShape, scene);
        }
    }

    private static CreatePhysicsBody(transform: TransformNode, shape: PhysicsShape, scene: Scene): PhysicsBody {
        const physicsBody = new PhysicsBody(transform, PhysicsMotionType.STATIC, false, scene);
        physicsBody.shape = shape;
        physicsBody.setMassProperties({ mass: 0 });
        physicsBody.disablePreStep = false;

        return physicsBody;
    }

    public hasBeenDisposed() {
        return this.disposed;
    }

    public dispose() {
        this.scatteringSystem.clearChunk(this.mesh.name);
        this.physicsBody?.dispose();
        this.physicsShape?.dispose();
        this.mesh.dispose();
        this.disposed = true;
    }

    computeCulling(camera: Camera) {
        if (!this.isLoaded()) {
            return;
        }

        // chunks on the other side of the planet are culled
        // as chunks have dimensions, we use the bounding sphere to do conservative culling
        const chunkToCameraDir = camera.globalPosition.subtract(this.getTransform().getAbsolutePosition()).normalize();
        const closestPointToCamera = this.getTransform()
            .getAbsolutePosition()
            .add(chunkToCameraDir.scale(this.getBoundingRadius()));
        const conservativeSphereNormal = closestPointToCamera
            .subtract(this.parent.getAbsolutePosition())
            .normalizeToNew();

        const observerToCenter = camera.globalPosition.subtract(this.parent.getAbsolutePosition()).normalize();

        const isEnabled =
            Vector3.Dot(observerToCenter, conservativeSphereNormal) >= 0 &&
            isSizeOnScreenEnough(this, camera, 0.002 / 5);

        this.setActiveForCulling(isEnabled);
    }
}
