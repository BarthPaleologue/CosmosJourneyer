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

import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Light } from "@babylonjs/core/Lights/light";
import { BlackHoleModel } from "./blackHoleModel";
import { StellarObject } from "../../architecture/stellarObject";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getOrbitalObjectTypeToI18nString } from "../../utils/strings/orbitalObjectTypeToDisplay";
import { defaultTargetInfoCelestialBody, TargetInfo } from "../../architecture/targetable";
import { BlackHoleUniforms } from "./blackHoleUniforms";
import { Axis, Space } from "@babylonjs/core/Maths/math.axis";

export class BlackHole implements StellarObject {
    readonly name: string;

    private readonly transform: TransformNode;

    readonly light: PointLight;

    readonly model: BlackHoleModel;

    readonly ringsUniforms = null;

    readonly asteroidField = null;

    readonly blackHoleUniforms: BlackHoleUniforms;

    readonly targetInfo: TargetInfo;

    constructor(model: BlackHoleModel, scene: Scene) {
        this.model = model;

        this.name = this.model.name;

        this.transform = new TransformNode(this.model.name, scene);
        this.getTransform().rotate(Axis.X, this.model.orbit.inclination + this.model.physics.axialTilt, Space.WORLD);

        this.light = new PointLight(`${this.model.name}Light`, Vector3.Zero(), scene);
        //this.light.diffuse.fromArray(getRgbFromTemperature(this.model.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();
        if (this.model.physics.accretionDiskRadius === 0) this.light.intensity = 0;

        this.blackHoleUniforms = new BlackHoleUniforms(this.model);

        this.targetInfo = defaultTargetInfoCelestialBody(this.getBoundingRadius());
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getLight(): PointLight {
        return this.light;
    }

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return this.getRadius();
    }

    public dispose(): void {
        this.light.dispose();
        this.transform.dispose();
    }
}
