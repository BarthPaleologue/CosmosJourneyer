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
import { type TelluricPlanetModel, type TelluricSatelliteModel } from "@cosmos-journeyer/universe-model";

import { type Cullable } from "@/frontend/helpers/cullable";
import { isSizeOnScreenEnough } from "@/frontend/helpers/isObjectVisibleOnScreen";
import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { type Transformable } from "@/frontend/universe/architecture/transformable";

import { type DeepReadonly } from "@/utils/types";

import { CollisionMask, Settings } from "@/settings";

import { getChunkPlaneSpacePositionFromPath } from "./chunkUtils";
import { getQuaternionFromDirection, type Direction } from "./direction";
import type { ScatteredInstances, ScatteringSystem } from "./scatteringSystem";

export class PlanetChunk implements Transformable, HasBoundingSphere, Cullable {
    public readonly mesh: Mesh;
    private readonly depth: number;
    public readonly cubePosition: Vector3;
    private readonly planetLocalPosition: Vector3;

    private readonly chunkSideLength: number;

    private loaded = false;

    private readonly parent: TransformNode;

    private aggregate: PhysicsAggregate | null = null;

    private averageHeight = 0;

    private disposed = false;

    private readonly scatteringSystem: ScatteringSystem;

    constructor(
        path: number[],
        direction: Direction,
        parentAggregate: PhysicsAggregate,
        material: Material,
        planetModel: DeepReadonly<TelluricPlanetModel> | DeepReadonly<TelluricSatelliteModel>,
        rootLength: number,
        scatteringSystem: ScatteringSystem,
        scene: Scene,
    ) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.chunkSideLength = rootLength / 2 ** this.depth;

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

        this.scatteringSystem = scatteringSystem;
    }

    public getTransform(): TransformNode {
        return this.mesh;
    }

    /**
     * Initializes the chunk with the given vertex data. Scatters instances on the chunk based on the given scattered point buffer.
     * @param vertexData the vertex data to apply to the chunk
     * @param scatteredInstances Matrix buffers for scattered assets on the chunk
     * @param averageHeight
     */
    public init(vertexData: VertexData, scatteredInstances: ScatteredInstances, averageHeight: number) {
        if (this.hasBeenDisposed()) {
            console.error(`Tried to init ${this.mesh.name} but it has been disposed`);
            return;
        }

        vertexData.applyToMesh(this.mesh, false);
        this.mesh.freezeNormals();

        if (this.chunkSideLength / (Settings.VERTEX_RESOLUTION - 1) <= Settings.MAX_DISTANCE_BETWEEN_PHYSICS_VERTICES) {
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

        this.mesh.receiveShadows = true;
        this.mesh.setEnabled(true);
        this.loaded = true;

        this.averageHeight = averageHeight;
        this.mesh.computeWorldMatrix(true);

        this.scatteringSystem.scatterInChunk(this.mesh, scatteredInstances);
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
        this.scatteringSystem.clearChunk(this.mesh.name);
        this.aggregate?.dispose();
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

        this.mesh.setEnabled(isEnabled);
    }
}
