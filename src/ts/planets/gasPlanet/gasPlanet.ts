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

import { GasPlanetMaterial } from "./gasPlanetMaterial";
import { GasPlanetModel } from "./gasPlanetModel";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { isSizeOnScreenEnough } from "../../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { Planet } from "../../architecture/planet";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { TransformNode } from "@babylonjs/core/Meshes";
import { CelestialBody } from "../../architecture/celestialBody";
import { OrbitalObject } from "../../architecture/orbitalObject";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { Cullable } from "../../utils/cullable";
import { RingsUniforms } from "../../rings/ringsUniform";
import { OrbitalObjectPhysicalProperties } from "../../architecture/physicalProperties";
import { Transformable } from "../../architecture/transformable";
import i18n from "../../i18n";
import { Scene } from "@babylonjs/core/scene";
import { AsteroidField } from "../../asteroidFields/asteroidField";

export class GasPlanet implements Planet, Cullable {
    private readonly mesh: Mesh;
    readonly material: GasPlanetMaterial;

    readonly aggregate: PhysicsAggregate;
    readonly model: GasPlanetModel;

    name: string;
    parent: OrbitalObject | null;
    postProcesses: PostProcessType[] = [];

    readonly ringsUniforms: RingsUniforms | null;
    private readonly asteroidField: AsteroidField | null;

    /**
     * New Gas Planet
     * @param name The name of the planet
     * @param scene
     * @param parentBody The bodies the planet is orbiting
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     */
    constructor(name: string, scene: Scene, model: GasPlanetModel | number, parentBody: CelestialBody | null = null) {
        this.name = name;

        this.parent = parentBody;

        this.model = model instanceof GasPlanetModel ? model : new GasPlanetModel(model, parentBody?.model);

        this.mesh = MeshBuilder.CreateSphere(
            name,
            {
                diameter: this.model.radius * 2,
                segments: 64
            },
            scene
        );

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
        this.aggregate.shape.addChildFromParent(this.getTransform(), physicsShape, this.mesh);

        this.material = new GasPlanetMaterial(this.name, this.getTransform(), this.model, scene);
        this.mesh.material = this.material;

        this.postProcesses.push(PostProcessType.ATMOSPHERE, PostProcessType.SHADOW);
        if (this.model.rings !== null) {
            this.postProcesses.push(PostProcessType.RING);
            this.ringsUniforms = new RingsUniforms(this.model.rings, scene);

            const averageRadius = this.model.radius * (this.model.rings.ringStart + this.model.rings.ringEnd) / 2;
            const spread = this.model.radius * (this.model.rings.ringEnd - this.model.rings.ringStart) / 2;
            this.asteroidField = new AsteroidField(this.getTransform(), averageRadius, spread, scene);
        } else {
            this.ringsUniforms = null;
            this.asteroidField = null;
        }

        this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);
    }

    updateMaterial(stellarObjects: Transformable[], deltaSeconds: number): void {
        this.material.update(stellarObjects, deltaSeconds);
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.model.radius;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getRingsUniforms(): RingsUniforms | null {
        return this.ringsUniforms;
    }

    getAsteroidField(): AsteroidField | null {
        return this.asteroidField;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:gasPlanet");
    }

    public computeCulling(cameras: Camera[]): void {
        let isVisible = false;
        for (const camera of cameras) {
            isVisible = isVisible || isSizeOnScreenEnough(this, camera);
        }

        // the mesh is hidden if it is not visible from any camera
        this.mesh.isVisible = isVisible;
    }

    public dispose(): void {
        this.mesh.dispose();
        this.aggregate.dispose();
        this.material.dispose();
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    getTransform(): TransformNode {
        return this.mesh;
    }
}
