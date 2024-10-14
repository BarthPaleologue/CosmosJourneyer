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

import { Axis } from "@babylonjs/core/Maths/math.axis";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { Light } from "@babylonjs/core/Lights/light";
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { BlackHoleModel } from "./blackHoleModel";
import { StellarObject } from "../../architecture/stellarObject";
import { Cullable } from "../../utils/cullable";
import { TransformNode } from "@babylonjs/core/Meshes";
import { RingsUniforms } from "../../rings/ringsUniform";
import { AsteroidField } from "../../asteroidFields/asteroidField";
import { orbitalObjectTypeToDisplay } from "../../utils/strings/orbitalObjectTypeToDisplay";

export class BlackHole implements StellarObject, Cullable {
    readonly name: string;

    private readonly transform: TransformNode;

    readonly light: PointLight;

    readonly model: BlackHoleModel;

    readonly postProcesses: PostProcessType[] = [];

    constructor(model: BlackHoleModel, scene: Scene) {
        this.model = model;

        this.name = this.model.name;

        this.transform = new TransformNode(this.model.name, scene);
        this.transform.rotate(Axis.X, this.model.physics.axialTilt);

        this.light = new PointLight(`${this.model.name}Light`, Vector3.Zero(), scene);
        //this.light.diffuse.fromArray(getRgbFromTemperature(this.model.physicalProperties.temperature).asArray());
        this.light.falloffType = Light.FALLOFF_STANDARD;
        this.light.parent = this.getTransform();
        if (this.model.physics.accretionDiskRadius === 0) this.light.intensity = 0;

        this.postProcesses.push(PostProcessType.BLACK_HOLE);
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

    getRingsUniforms(): RingsUniforms | null {
        return null;
    }

    getAsteroidField(): AsteroidField | null {
        return null;
    }

    getTypeName(): string {
        return orbitalObjectTypeToDisplay(this.model);
    }

    public computeCulling(cameras: Camera[]): void {
        return;
    }

    public getRadius(): number {
        return this.model.radius;
    }

    public getBoundingRadius(): number {
        return Math.max(this.getRadius(), this.model.physics.accretionDiskRadius);
    }

    public dispose(): void {
        this.light.dispose();
        this.transform.dispose();
    }
}
