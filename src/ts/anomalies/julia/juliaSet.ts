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
import { PostProcessType } from "../../postProcesses/postProcessTypes";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { CelestialBody } from "../../architecture/celestialBody";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Scene } from "@babylonjs/core/scene";
import { OrbitProperties } from "../../orbit/orbitProperties";
import { RingsUniforms } from "../../rings/ringsUniform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Cullable } from "../../utils/cullable";
import { OrbitalObjectPhysicalProperties } from "../../architecture/physicalProperties";
import i18n from "../../i18n";
import { Anomaly } from "../anomaly";
import { AnomalyType } from "../anomalyType";
import { AsteroidField } from "../../asteroidFields/asteroidField";
import { StarSystemModel } from "../../starSystem/starSystemModel";

export class JuliaSet implements Anomaly, Cullable {
    readonly name: string;

    readonly model: JuliaSetModel;

    readonly anomalyType = AnomalyType.JULIA_SET;

    private readonly transform: TransformNode;

    readonly postProcesses: PostProcessType[] = [];

    readonly parent: CelestialBody | null = null;

    /**
     * New Gas Planet
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     * @param starSystemModel
     * @param scene
     * @param parentBody The bodies the planet is orbiting
     */
    constructor(model: JuliaSetModel | number, starSystemModel: StarSystemModel, scene: Scene, parentBody: CelestialBody | null = null) {
        this.model = model instanceof JuliaSetModel ? model : new JuliaSetModel(model, starSystemModel, parentBody?.model);

        this.name = this.model.name;

        this.parent = parentBody;

        this.transform = new TransformNode(this.name, scene);

        this.postProcesses.push(PostProcessType.JULIA_SET);

        this.getTransform().rotate(Axis.X, this.model.physicalProperties.axialTilt);
    }

    getTransform(): TransformNode {
        return this.transform;
    }

    getRotationAxis(): Vector3 {
        return this.getTransform().up;
    }

    getOrbitProperties(): OrbitProperties {
        return this.model.orbit;
    }

    getPhysicalProperties(): OrbitalObjectPhysicalProperties {
        return this.model.physicalProperties;
    }

    getRingsUniforms(): RingsUniforms | null {
        return null;
    }

    getAsteroidField(): AsteroidField | null {
        return null;
    }

    getRadius(): number {
        return this.model.radius;
    }

    getBoundingRadius(): number {
        return this.model.radius;
    }

    getTypeName(): string {
        return i18n.t("objectTypes:anomaly");
    }

    computeCulling(cameras: Camera[]): void {
        // do nothing
    }

    dispose() {
        this.transform.dispose();
    }
}
