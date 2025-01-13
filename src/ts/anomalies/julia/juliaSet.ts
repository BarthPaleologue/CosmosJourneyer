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

import { Camera } from "@babylonjs/core/Cameras/camera";
import { JuliaSetModel } from "./juliaSetModel";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Cullable } from "../../utils/cullable";
import { CelestialBody } from "../../architecture/celestialBody";
import { getOrbitalObjectTypeToI18nString } from "../../utils/strings/orbitalObjectTypeToDisplay";
import { defaultTargetInfoCelestialBody, TargetInfo } from "../../architecture/targetable";
import { setRotationQuaternion } from "../../uberCore/transforms/basicTransform";

export class JuliaSet implements CelestialBody, Cullable {
    readonly model: JuliaSetModel;

    private readonly transform: TransformNode;

    readonly ringsUniforms = null;
    readonly asteroidField = null;

    readonly targetInfo: TargetInfo;

    /**
     * New Gas Planet
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     * @param scene
     */
    constructor(model: JuliaSetModel, scene: Scene) {
        this.model = model;

        this.transform = new TransformNode(this.model.name, scene);

        setRotationQuaternion(this.getTransform(), this.model.physics.axialTilt);

        this.targetInfo = defaultTargetInfoCelestialBody(this.getBoundingRadius());
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getRadius(): number {
        return this.model.radius;
    }

    getBoundingRadius(): number {
        return this.model.radius;
    }

    getTypeName(): string {
        return getOrbitalObjectTypeToI18nString(this.model);
    }

    computeCulling(camera: Camera): void {
        // do nothing
    }

    dispose() {
        this.transform.dispose();
    }
}
