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
import { type TransformNode, type VertexData } from "@babylonjs/core/Meshes";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { type Scene } from "@babylonjs/core/scene";

import { type TelluricPlanetModel } from "@/backend/universe/orbitalObjects/telluricPlanetModel";
import { type TelluricSatelliteModel } from "@/backend/universe/orbitalObjects/telluricSatelliteModel";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { type Cullable } from "@/frontend/helpers/cullable";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { type DeepReadonly } from "@/utils/types";

import { CollisionMask } from "@/settings";

import { InstancePatch } from "../instancePatch/instancePatch";
import { type IPatch } from "../instancePatch/iPatch";
import { randomDownSample } from "../instancePatch/matrixBuffer";
import { ThinInstancePatch } from "../instancePatch/thinInstancePatch";
import { getChunkPlaneSpacePositionFromPath } from "./chunkUtils";
import { getQuaternionFromDirection, type Direction } from "./direction";

export class PlanetChunk implements Transformable, HasBoundingSphere, Cullable {
    public readonly mesh: Mesh;
    private readonly depth: number;
    public readonly cubePosition: Vector3;
    private readonly planetLocalPosition: Vector3;

    private readonly planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>;

    private readonly chunkSideLength: number;

    private loaded = false;

    private readonly parent: TransformNode;

    readonly instancePatches: IPatch[] = [];

    private aggregate: PhysicsAggregate | null = null;

    private averageHeight = 0;

    readonly helpers: Mesh[] = [];

    private disposed = false;

    constructor(
        path: number[],
        direction: Direction,
        parentAggregate: PhysicsAggregate,
        material: Material,
        planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
        rootLength: number,
        scene: Scene,
    ) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.chunkSideLength = rootLength / 2 ** this.depth;

        this.planetModel = planetModel;

        this.mesh = new Mesh(`${planetModel.name}_Chunk${id}`, scene);
        this.mesh.setEnabled(false);

        this.mesh.material = material;
        //this.mesh.material = Materials.DebugMaterial(id, false, false, scene);

        this.mesh.parent = parentAggregate.transformNode;

        //this.mesh.occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        //this.mesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;

        this.parent = parentAggregate.transformNode;

        // computing the position of the chunk on the side of the planet
        const position = getChunkPlaneSpacePositionFromPath(rootLength, path);

        // offseting from planet center to position on the side (default side then rotation for all sides)
        position.z -= rootLength / 2;
        position.applyRotationQuaternionInPlace(getQuaternionFromDirection(direction));

        this.cubePosition = position.clone();

        position.normalize().scaleInPlace(rootLength / 2);

        this.planetLocalPosition = position.clone();
        this.getTransform().position = position;

        // Node material hack: we store the planet-space position of the chunk in the instance color for easy access from Babylon NodeMaterial
        this.mesh.registerInstancedBuffer("instanceColor", 4);
        this.mesh.instancedBuffers["instanceColor"] = new Color4(
            this.planetLocalPosition.x,
            this.planetLocalPosition.y,
            this.planetLocalPosition.z,
            1,
        );
    }

    public getTransform(): TransformNode {
        return this.mesh;
    }

    /**
     * Initializes the chunk with the given vertex data. Scatters instances on the chunk based on the given instancesMatrixBuffer and alignedInstancesMatrixBuffer
     * @param vertexData the vertex data to apply to the chunk
     * @param instancesMatrixBuffer the matrix buffer containing the instances matrix
     * @param alignedInstancesMatrixBuffer the matrix buffer containing the vertically aligned instances matrix
     * @param averageHeight
     */
    public init(
        vertexData: VertexData,
        instancesMatrixBuffer: Float32Array,
        alignedInstancesMatrixBuffer: Float32Array,
        averageHeight: number,
        assets: RenderingAssets,
    ) {
        if (this.hasBeenDisposed()) {
            throw new Error(`Tried to init ${this.mesh.name} but it has been disposed`);
        }

        vertexData.applyToMesh(this.mesh, false);
        // The following is a code snippet to use the approximate normals of the mesh instead of
        // the analytic normals. This is useful for debugging purposes
        /*if(!analyticNormal) {
    this.mesh.createNormals(true);
    const normals = this.mesh.getVerticesData(VertexBuffer.NormalKind);
    if (normals === null) throw new Error("Mesh has no normals");
    for(let i = 0; i < normals.length; i++) {
        normals[i] = -normals[i];
    }
    this.mesh.setVerticesData(VertexBuffer.NormalKind, normals);
}*/
        this.mesh.freezeNormals();

        if (this.depth > 3) {
            this.aggregate = new PhysicsAggregate(
                this.mesh,
                PhysicsShapeType.MESH,
                { mass: 0, restitution: 0, friction: 2 },
                this.mesh.getScene(),
            );
            this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
            this.aggregate.body.disablePreStep = false;
            this.aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            this.aggregate.shape.filterCollideMask = CollisionMask.EVERYTHING & ~CollisionMask.ENVIRONMENT;
        }

        this.mesh.setEnabled(true);
        this.loaded = true;

        this.averageHeight = averageHeight;

        if (instancesMatrixBuffer.length === 0) return;

        const rockPatch = new InstancePatch(this.parent, randomDownSample(alignedInstancesMatrixBuffer, 3200));
        rockPatch.createInstances([{ mesh: assets.objects.rock, distance: 0 }]);
        this.instancePatches.push(rockPatch);

        if (
            this.planetModel.atmosphere !== null &&
            this.planetModel.ocean !== null &&
            this.getAverageHeight() > this.planetModel.ocean.depth + 50
        ) {
            const treePatch = new InstancePatch(this.parent, randomDownSample(instancesMatrixBuffer, 4800));
            treePatch.createInstances([{ mesh: assets.objects.tree, distance: 0 }]);
            this.instancePatches.push(treePatch);

            const butterflyPatch = new ThinInstancePatch(randomDownSample(instancesMatrixBuffer, 800));
            butterflyPatch.createInstances([{ mesh: assets.objects.butterfly, distance: 0 }]);
            for (const butterflyMesh of butterflyPatch.getLodMeshes()) {
                butterflyMesh.parent = this.parent;
            }
            this.instancePatches.push(butterflyPatch);

            const grassPatch = new ThinInstancePatch(alignedInstancesMatrixBuffer);
            grassPatch.createInstances([
                { mesh: assets.objects.grassBlades[0], distance: 0 },
                { mesh: assets.objects.grassBlades[1], distance: 50 },
            ]);
            for (const grassMesh of grassPatch.getLodMeshes()) {
                grassMesh.parent = this.parent;
            }
            this.instancePatches.push(grassPatch);
        }
    }

    /**
     * When the chunk has a Havok body, parenting is ignored so this method must be called to compensate.
     * If the chunk has no Havok body, this method does nothing
     */
    public updatePosition() {
        if (this.aggregate === null) return;
        this.getTransform().setAbsolutePosition(
            Vector3.TransformCoordinates(this.planetLocalPosition, this.parent.getWorldMatrix()),
        );
    }

    public getAverageHeight(): number {
        return this.averageHeight;
    }

    public getBoundingRadius(): number {
        return this.chunkSideLength / 2;
    }

    /**
     * Returns true if the chunk is ready to be enabled (i.e if the chunk has recieved its vertex data)
     * @returns true if the chunk is ready to be enabled (i.e if the chunk has recieved its vertex data)
     */
    public isLoaded() {
        return this.loaded;
    }

    public hasBeenDisposed() {
        return this.disposed;
    }

    public dispose() {
        this.aggregate?.dispose();

        this.helpers.forEach((helper) => {
            helper.dispose();
        });
        this.helpers.length = 0;

        this.instancePatches.forEach((patch) => {
            patch.dispose();
        });
        this.instancePatches.length = 0;

        this.mesh.dispose();

        this.disposed = true;
    }

    computeCulling(camera: Camera) {
        if (!this.isLoaded()) return;

        // chunks on the other side of the planet are culled
        // as chunks have dimensions, we use the bounding sphere to do conservative culling
        const chunkToCameraDir = camera.globalPosition.subtract(this.getTransform().getAbsolutePosition()).normalize();
        const closestPointToCamera = this.getTransform()
            .getAbsolutePosition()
            .add(chunkToCameraDir.scale(this.getBoundingRadius()));
        const conservativeSphereNormal = closestPointToCamera
            .subtract(this.parent.getAbsolutePosition())
            .normalizeToNew();
        const observerToCenter = camera.globalPosition.subtract(this.parent.getAbsolutePosition()).normalizeToNew();

        const isEnabled =
            Vector3.Dot(observerToCenter, conservativeSphereNormal) >= 0 &&
            isSizeOnScreenEnough(this, camera, 0.002 / 5);

        this.mesh.setEnabled(isEnabled);

        this.instancePatches.forEach((patch) => {
            let minDistance = Number.MAX_VALUE;
            const distanceVector = camera.globalPosition.subtract(this.getTransform().getAbsolutePosition());

            // instance patches are not rendered when the chunk is too far
            const sphereNormal = this.getTransform()
                .getAbsolutePosition()
                .subtract(this.parent.getAbsolutePosition())
                .normalizeToNew();

            const normalComponent = sphereNormal.scale(distanceVector.dot(sphereNormal));
            const tangentialDistance = distanceVector.subtract(normalComponent).length();

            const isVisible = tangentialDistance < 200;
            minDistance = Math.min(minDistance, tangentialDistance);

            patch.setEnabled(isVisible);
            patch.handleLod(minDistance);
        });
    }
}
