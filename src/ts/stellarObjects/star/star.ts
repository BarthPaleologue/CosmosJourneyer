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

import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StarMaterial } from "./starMaterial";
import { getStellarTypeFromTemperature, StarModel } from "./starModel";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Light } from "@babylonjs/core/Lights/light";
import { setRotationQuaternion } from "../../uberCore/transforms/basicTransform";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { isSizeOnScreenEnough } from "../../utils/isObjectVisibleOnScreen";
import { TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { StellarObject } from "../../architecture/stellarObject";
import { Cullable } from "../../utils/cullable";
import { RingsUniforms } from "../../rings/ringsUniform";
import { OrbitalObjectPhysicalProperties } from "../../architecture/physicalProperties";
import { Scene } from "@babylonjs/core/scene";
import { AsteroidField } from "../../asteroidFields/asteroidField";
import { Orbit } from "../../orbit/orbit";
import { getRgbFromTemperature } from "../../utils/specrend";
import i18n from "../../i18n";

import { orbitalObjectTypeToDisplay } from "../../utils/orbitalObjectTypeToDisplay";

export class Star implements StellarObject, Cullable {
    readonly name: string;

    readonly mesh: Mesh;
    readonly light: PointLight;
    private readonly material: StarMaterial;

    readonly aggregate: PhysicsAggregate;

    readonly postProcesses: PostProcessType[] = [];

    readonly ringsUniforms: RingsUniforms | null;

    private readonly asteroidField: AsteroidField | null;

    readonly model: StarModel;

    /**
     * New Star
     * @param model The seed of the star in [-1, 1]
     * @param scene
     */
    constructor(model: StarModel, scene: Scene) {
        this.model = model;

        this.name = this.model.name;

        this.mesh = MeshBuilder.CreateSphere(
            this.name,
            {
                diameter: this.model.radius * 2,
                segments: 32
            },
            scene
        );

        this.aggregate = new PhysicsAggregate(
            this.getTransform(),
            PhysicsShapeType.SPHERE,
            {
                mass: 0,
                restitution: 0.2
            },
            scene
        );
        this.aggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });
        this.aggregate.body.disablePreStep = false;

        this.light = new PointLight(`${this.name}Light`, Vector3.Zero(), scene);
        this.light.diffuse = getRgbFromTemperature(this.model.temperature);
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();

        this.material = new StarMaterial(this.model, scene);
        this.mesh.material = this.material;

        setRotationQuaternion(this.getTransform(), Quaternion.Identity());

        this.postProcesses.push(PostProcessType.VOLUMETRIC_LIGHT, PostProcessType.LENS_FLARE);
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
    }

    getTransform(): TransformNode {
        return this.mesh;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getLight(): PointLight {
        return this.light;
    }

    getOrbitProperties(): Orbit {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    getRingsUniforms(): RingsUniforms | null {
        return this.ringsUniforms;
    }

    getAsteroidField(): AsteroidField | null {
        return this.asteroidField;
    }

    getTypeName(): string {
        return orbitalObjectTypeToDisplay(this.model);
    }

    public updateMaterial(deltaTime: number): void {
        this.material.update(deltaTime);
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.getRadius();
    }

    public computeCulling(cameras: Camera[]): void {
        let isVisible = false;
        for (const camera of cameras) {
            isVisible = isVisible || isSizeOnScreenEnough(this, camera);
        }
        this.mesh.isVisible = isVisible;
    }

    public dispose(): void {
        this.aggregate.dispose();
        this.material.dispose();
        this.light.dispose();
        this.asteroidField?.dispose();
        this.ringsUniforms?.dispose();
        this.mesh.dispose();
    }
}
