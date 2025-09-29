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

import { Light } from "@babylonjs/core/Lights/light";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { type CubeTexture } from "@babylonjs/core/Materials/Textures/cubeTexture";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { type Scene } from "@babylonjs/core/scene";

import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { type BlackHoleModel } from "@/backend/universe/orbitalObjects/stellarObjects/blackHoleModel";

import { getOrbitalObjectTypeToI18nString } from "@/frontend/helpers/orbitalObjectTypeToDisplay";
import { type StellarObjectBase } from "@/frontend/universe/architecture/stellarObject";
import { defaultTargetInfoCelestialBody, type TargetInfo } from "@/frontend/universe/architecture/targetable";

import { type DeepReadonly } from "@/utils/types";

import { BlackHoleUniforms } from "./blackHoleUniforms";

export class BlackHole implements StellarObjectBase<OrbitalObjectType.BLACK_HOLE> {
    readonly name: string;

    private readonly transform: TransformNode;

    readonly light: PointLight;

    readonly model: DeepReadonly<BlackHoleModel>;

    readonly type = OrbitalObjectType.BLACK_HOLE;

    readonly ringsUniforms = null;

    readonly asteroidField = null;

    readonly blackHoleUniforms: BlackHoleUniforms;

    readonly targetInfo: TargetInfo;

    constructor(model: DeepReadonly<BlackHoleModel>, backgroundTexture: CubeTexture, scene: Scene) {
        this.model = model;

        this.name = this.model.name;

        this.transform = new TransformNode(this.model.name, scene);
        this.transform.rotationQuaternion = Quaternion.Identity();

        this.light = new PointLight(`${this.model.name}Light`, Vector3.Zero(), scene);
        //this.light.diffuse.fromArray(getRgbFromTemperature(this.model.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();
        if (this.model.accretionDiskRadius === 0) this.light.intensity = 0;

        this.blackHoleUniforms = new BlackHoleUniforms(this.model, backgroundTexture);

        this.targetInfo = defaultTargetInfoCelestialBody(this.getBoundingRadius());
    }

    getTransform(): TransformNode {
        return this.transform;
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
