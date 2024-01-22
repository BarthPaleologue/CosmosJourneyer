//  This file is part of CosmosJourneyer
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

import { Camera } from "@babylonjs/core/Cameras/camera";
import { MandelbulbModel } from "./mandelbulbModel";
import { PostProcessType } from "../postProcesses/postProcessTypes";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { CelestialBody } from "../architecture/celestialBody";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Scene } from "@babylonjs/core/scene";
import { OrbitProperties } from "../orbit/orbitProperties";
import { RingsUniforms } from "../postProcesses/rings/ringsUniform";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Cullable } from "../bodies/cullable";
import { OrbitalObjectPhysicalProperties } from "../architecture/physicalProperties";

export class Mandelbulb implements CelestialBody, Cullable {
    readonly name: string;

    readonly model: MandelbulbModel;

    private readonly transform: TransformNode;

    readonly postProcesses: PostProcessType[] = [];

    readonly parent: CelestialBody | null = null;

    /**
     * New Gas Planet
     * @param name The name of the planet
     * @param scene
     * @param parentBody The bodies the planet is orbiting
     * @param model The model to create the planet from or a seed for the planet in [-1, 1]
     */
    constructor(name: string, scene: Scene, model: MandelbulbModel | number, parentBody: CelestialBody | null = null) {
        this.name = name;

        this.model = model instanceof MandelbulbModel ? model : new MandelbulbModel(model, parentBody?.model);

        this.parent = parentBody;

        this.transform = new TransformNode(`${name}Transform`, scene);

        this.postProcesses.push(PostProcessType.MANDELBULB);

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
        return this.model.ringsUniforms;
    }

    getRadius(): number {
        return this.model.radius;
    }

    getBoundingRadius(): number {
        return this.model.radius;
    }

    getTypeName(): string {
        return "Anomaly";
    }

    computeCulling(camera: Camera): void {
        // do nothing
    }

    dispose() {
        this.transform.dispose();
    }
}
