//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { Direction, getQuaternionFromDirection } from "../../../../utils/direction";
import { getChunkPlaneSpacePositionFromPath } from "../../../../utils/chunkUtils";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Material } from "@babylonjs/core/Materials/material";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Engines/Extensions/engine.query";
import { TransformNode, VertexData } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { Observable } from "@babylonjs/core/Misc/observable";
import { ThinInstancePatch } from "../instancePatch/thinInstancePatch";
import { randomDownSample } from "../instancePatch/matrixBuffer";
import { Assets } from "../../../../assets";
import { isSizeOnScreenEnough } from "../../../../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { IPatch } from "../instancePatch/iPatch";
import { TelluricPlanetModel } from "../../telluricPlanetModel";
import { BoundingSphere } from "../../../../architecture/boundingSphere";
import { PhysicsMotionType, PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { Transformable } from "../../../../architecture/transformable";
import { CollisionMask } from "../../../../settings";
import { InstancePatch } from "../instancePatch/instancePatch";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Cullable } from "../../../../bodies/cullable";

export class PlanetChunk implements Transformable, BoundingSphere, Cullable {
    public readonly mesh: Mesh;
    private readonly depth: number;
    public readonly cubePosition: Vector3;
    private readonly planetLocalPosition: Vector3;

    private readonly planetModel: TelluricPlanetModel;

    private readonly chunkSideLength: number;

    private loaded = false;

    private readonly parent: TransformNode;

    readonly instancePatches: IPatch[] = [];

    readonly onReceiveVertexDataObservable = new Observable<void>();
    readonly onDisposeObservable = new Observable<void>();

    private aggregate: PhysicsAggregate | null = null;

    private averageHeight = 0;

    readonly helpers: Mesh[] = [];

    private disposed = false;

    private readonly scene: Scene;

    constructor(path: number[], direction: Direction, parentAggregate: PhysicsAggregate, material: Material, planetModel: TelluricPlanetModel, rootLength: number, scene: Scene) {
        const id = `D${direction}P${path.join("")}`;

        this.depth = path.length;

        this.chunkSideLength = rootLength / 2 ** this.depth;

        this.planetModel = planetModel;

        this.mesh = new Mesh(`Chunk${id}`, scene);
        this.mesh.setEnabled(false);

        this.scene = scene;

        this.mesh.material = material;
        //this.mesh.material = Assets.DebugMaterial(id, false, false, scene);

        this.mesh.parent = parentAggregate.transformNode;

        this.mesh.occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        this.mesh.occlusionType = AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;

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
    public init(vertexData: VertexData, instancesMatrixBuffer: Float32Array, alignedInstancesMatrixBuffer: Float32Array, averageHeight: number) {
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
            this.aggregate = new PhysicsAggregate(this.mesh, PhysicsShapeType.MESH, { mass: 0 }, this.mesh.getScene());
            this.aggregate.body.setMotionType(PhysicsMotionType.STATIC);
            this.aggregate.body.disablePreStep = false;
            this.aggregate.shape.filterMembershipMask = CollisionMask.ENVIRONMENT;
            this.aggregate.shape.filterCollideMask = CollisionMask.DYNAMIC_OBJECTS;
        }

        this.mesh.setEnabled(true);
        this.loaded = true;

        this.averageHeight = averageHeight;

        this.onReceiveVertexDataObservable.notifyObservers();

        if (instancesMatrixBuffer.length === 0) return;

        const rockPatch = new InstancePatch(this.parent, randomDownSample(alignedInstancesMatrixBuffer, 3200));
        rockPatch.createInstances(Assets.ROCK);
        this.instancePatches.push(rockPatch);

        if (
            this.planetModel.physicalProperties.pressure > 0 &&
            this.planetModel.physicalProperties.oceanLevel > 0 &&
            this.getAverageHeight() > this.planetModel.physicalProperties.oceanLevel + 50
        ) {
            const treePatch = new InstancePatch(this.parent, randomDownSample(instancesMatrixBuffer, 4800));
            treePatch.createInstances(Assets.TREE);
            this.instancePatches.push(treePatch);

            const butterflyPatch = new ThinInstancePatch(this.parent, randomDownSample(instancesMatrixBuffer, 800));
            butterflyPatch.createInstances(Assets.BUTTERFLY);
            this.instancePatches.push(butterflyPatch);

            const grassPatch = new ThinInstancePatch(this.parent, instancesMatrixBuffer);
            grassPatch.createInstances(Assets.GRASS_BLADE);
            this.instancePatches.push(grassPatch);

            for(const depthRenderer of Object.values(this.scene._depthRenderer)) {
                depthRenderer.setMaterialForRendering([butterflyPatch.getBaseMesh()], Assets.BUTTERFLY_DEPTH_MATERIAL);
                depthRenderer.setMaterialForRendering([grassPatch.getBaseMesh()], Assets.GRASS_DEPTH_MATERIAL);
            }
        }
    }

    /**
     * When the chunk has a Havok body, parenting is ignored so this method must be called to compensate.
     * If the chunk has no Havok body, this method does nothing
     */
    public updatePosition() {
        if (this.aggregate === null) return;
        this.getTransform().setAbsolutePosition(Vector3.TransformCoordinates(this.planetLocalPosition, this.parent.getWorldMatrix()));
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
    public isReady() {
        return this.loaded;
    }

    public hasBeenDisposed() {
        return this.disposed;
    }

    public dispose() {
        this.onDisposeObservable.notifyObservers();

        this.aggregate?.dispose();
        this.helpers.forEach((helper) => helper.dispose());
        this.instancePatches.forEach((patch) => patch.dispose());
        this.mesh.dispose();
        this.onReceiveVertexDataObservable.clear();
        this.onDisposeObservable.clear();

        this.disposed = true;
    }

    computeCulling(cameras: Camera[]) {
        if (!this.isReady()) return;

        let isVisible = false;

        for(const camera of cameras) {
            // chunks on the other side of the planet are culled
            // as chunks have dimensions, we use the bounding sphere to do conservative culling
            const chunkToCameraDir = camera.globalPosition.subtract(this.getTransform().getAbsolutePosition()).normalize();
            const closestPointToCamera = this.getTransform().getAbsolutePosition().add(chunkToCameraDir.scale(this.getBoundingRadius()));
            const conservativeSphereNormal = closestPointToCamera.subtract(this.parent.getAbsolutePosition()).normalizeToNew();
            const observerToCenter = camera.globalPosition.subtract(this.parent.getAbsolutePosition()).normalizeToNew();
            if (Vector3.Dot(observerToCenter, conservativeSphereNormal) < 0) {
                isVisible = isVisible || false;
                continue;
            }

            // chunks are only rendered if they are big enough on screen
            isVisible = isVisible || isSizeOnScreenEnough(this, camera);
        }

        this.mesh.setEnabled(isVisible);

        this.instancePatches.forEach((patch) => {
            let isVisible = false;
            for(const camera of cameras) {
                const distanceVector = camera.globalPosition.subtract(this.getTransform().getAbsolutePosition());

                // instance patches are not rendered when the chunk is too far
                const sphereNormal = this.getTransform().getAbsolutePosition().subtract(this.parent.getAbsolutePosition()).normalizeToNew();

                const normalComponent = sphereNormal.scale(distanceVector.dot(sphereNormal));
                const tangentialDistance = distanceVector.subtract(normalComponent).length();

                isVisible = isVisible || tangentialDistance < 200;
            }
            patch.setEnabled(isVisible);
        });
    }
}
