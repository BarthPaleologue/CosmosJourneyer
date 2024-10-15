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

import { Direction } from "../../utils/direction";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { TelluricPlanetMaterial } from "./telluricPlanetMaterial";
import { TelluricPlanetaryMassObjectModel } from "./telluricPlanetaryMassObjectModel";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ChunkTree } from "./terrain/chunks/chunkTree";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { Transformable } from "../../architecture/transformable";
import { ChunkForge } from "./terrain/chunks/chunkForge";
import { PlanetaryMassObject } from "../../architecture/planetaryMassObject";
import { Cullable } from "../../utils/cullable";
import { TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { RingsUniforms } from "../../rings/ringsUniform";
import { rotate } from "../../uberCore/transforms/basicTransform";
import { CloudsUniforms } from "../../clouds/cloudsUniforms";
import { Scene } from "@babylonjs/core/scene";
import { AsteroidField } from "../../asteroidFields/asteroidField";
import { orbitalObjectTypeToDisplay } from "../../utils/strings/orbitalObjectTypeToDisplay";

export class TelluricPlanet implements PlanetaryMassObject, Cullable {
    readonly sides: ChunkTree[]; // stores the 6 sides of the sphere

    readonly material: TelluricPlanetMaterial;

    readonly model: TelluricPlanetaryMassObjectModel;

    private readonly transform: TransformNode;
    readonly aggregate: PhysicsAggregate;

    readonly postProcesses: PostProcessType[] = [];

    readonly ringsUniforms: RingsUniforms | null;
    readonly asteroidField: AsteroidField | null;

    readonly cloudsUniforms: CloudsUniforms | null;

    /**
     * New Telluric Planet
     * @param model The model to build the planet or a seed for the planet in [-1, 1]
     * @param scene
     */
    constructor(model: TelluricPlanetaryMassObjectModel, scene: Scene) {
        this.model = model;

        this.transform = new TransformNode(this.model.name, scene);

        rotate(this.transform, Axis.X, this.model.physics.axialTilt);
        this.transform.computeWorldMatrix(true);

        this.aggregate = new PhysicsAggregate(
            this.getTransform(),
            PhysicsShapeType.CONTAINER,
            {
                mass: 0,
                restitution: 0.2
            },
            scene
        );
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });
        this.aggregate.body.disablePreStep = false;
        const physicsShape = new PhysicsShapeSphere(Vector3.Zero(), this.model.radius, scene);
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.getTransform());

        this.postProcesses.push(PostProcessType.SHADOW);

        if (this.model.physics.oceanLevel > 0) this.postProcesses.push(PostProcessType.OCEAN);
        if (this.model.physics.pressure > 0.05) this.postProcesses.push(PostProcessType.ATMOSPHERE);

        if (this.model.rings !== null) {
            this.postProcesses.push(PostProcessType.RING);
            this.ringsUniforms = new RingsUniforms(this.model.rings, scene);

            const averageRadius = (this.model.radius * (this.model.rings.ringStart + this.model.rings.ringEnd)) / 2;
            const spread = (this.model.radius * (this.model.rings.ringEnd - this.model.rings.ringStart)) / 2;
            this.asteroidField = new AsteroidField(this.model.rings.seed, this.getTransform(), averageRadius, spread, scene);
        } else {
            this.ringsUniforms = null;
            this.asteroidField = null;
        }

        if (this.model.clouds !== null) {
            this.postProcesses.push(PostProcessType.CLOUDS);
            this.cloudsUniforms = new CloudsUniforms(this.model.clouds, scene);
        } else {
            this.cloudsUniforms = null;
        }

        this.material = new TelluricPlanetMaterial(this.model, scene);

        this.sides = [
            new ChunkTree(Direction.UP, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.DOWN, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.FORWARD, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.BACKWARD, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.RIGHT, this.model, this.aggregate, this.material, scene),
            new ChunkTree(Direction.LEFT, this.model, this.aggregate, this.material, scene)
        ];
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getCloudsUniforms(): CloudsUniforms | null {
        return this.cloudsUniforms;
    }

    getTypeName(): string {
        return orbitalObjectTypeToDisplay(this.model);
    }

    /**
     * Update terrain of the sphere relative to the observer position
     * @param observerPosition
     * @param chunkForge
     */
    public updateLOD(observerPosition: Vector3, chunkForge: ChunkForge): void {
        for (const side of this.sides) side.update(observerPosition, chunkForge);
    }

    public updateMaterial(stellarObjects: Transformable[], deltaSeconds: number): void {
        this.material.update(this.getTransform().getWorldMatrix(), stellarObjects);
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.getRadius() + this.model.physics.oceanLevel;
    }

    public computeCulling(cameras: Camera[]): void {
        for (const side of this.sides) side.computeCulling(cameras);
    }

    public dispose(): void {
        this.sides.forEach((side) => side.dispose());
        this.sides.length = 0;

        this.cloudsUniforms?.dispose();
        this.ringsUniforms?.dispose();

        this.material.dispose();
        this.aggregate.dispose();
        this.transform.dispose();
        this.asteroidField?.dispose();
    }
}
