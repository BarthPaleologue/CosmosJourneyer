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

import surfaceMaterialFragment from "../../../shaders/gasPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../../shaders/gasPlanetMaterial/vertex.glsl";
import { GazColorSettings } from "../telluricPlanet/colorSettingsInterface";
import { normalRandom, randRange, randRangeInt } from "extended-random";
import { GasPlanetModel } from "./gasPlanetModel";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Transformable } from "../../architecture/transformable";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "../../postProcesses/uniforms/stellarObjectUniforms";

const GasPlanetMaterialUniformNames = {
    WORLD: "world",
    WORLD_VIEW_PROJECTION: "worldViewProjection",
    CAMERA_POSITION: "cameraPosition",
    SEED: "seed",
    TIME: "time",
    COLOR1: "color1",
    COLOR2: "color2",
    COLOR3: "color3",
    COLOR_SHARPNESS: "colorSharpness"
};

export class GasPlanetMaterial extends ShaderMaterial {
    readonly planet: TransformNode;
    readonly colorSettings: GazColorSettings;
    private elapsedSeconds = 0;

    private stellarObjects: Transformable[] = [];

    constructor(planetName: string, planet: TransformNode, model: GasPlanetModel, scene: Scene) {
        const shaderName = "gasPlanetMaterial";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
        }
        if (Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;
        }

        super(`${planetName}GasSurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [...Object.values(GasPlanetMaterialUniformNames), ...Object.values(StellarObjectUniformNames)]
        });

        this.planet = planet;

        const hue1 = normalRandom(240, 30, model.rng, 70);
        const hue2 = normalRandom(0, 180, model.rng, 72);

        const divergence = -180;

        const color1 = Color3.FromHSV(hue1 % 360, randRange(0.4, 0.9, model.rng, 72), randRange(0.7, 0.9, model.rng, 73));
        const color2 = Color3.FromHSV(hue2 % 360, randRange(0.6, 0.9, model.rng, 74), randRange(0.0, 0.3, model.rng, 75));
        const color3 = Color3.FromHSV((hue1 + divergence) % 360, randRange(0.4, 0.9, model.rng, 76), randRange(0.7, 0.9, model.rng, 77));

        this.colorSettings = {
            color1: color1,
            color2: color2,
            color3: color3,
            colorSharpness: randRangeInt(40, 80, model.rng, 80) / 10
        };

        this.setFloat(GasPlanetMaterialUniformNames.SEED, model.seed);

        this.setColor3(GasPlanetMaterialUniformNames.COLOR1, this.colorSettings.color1);
        this.setColor3(GasPlanetMaterialUniformNames.COLOR2, this.colorSettings.color2);
        this.setColor3(GasPlanetMaterialUniformNames.COLOR3, this.colorSettings.color3);

        this.updateConstants();

        this.onBindObservable.add((mesh) => {
            const activeCamera = mesh.getScene().activeCamera;
            if (activeCamera === null) throw new Error("No active camera in the scene");
            this.getEffect().setVector3(GasPlanetMaterialUniformNames.CAMERA_POSITION, activeCamera.globalPosition);
        });
    }

    public updateConstants(): void {
        this.setFloat(GasPlanetMaterialUniformNames.COLOR_SHARPNESS, this.colorSettings.colorSharpness);
    }

    public update(stellarObjects: Transformable[], deltaSeconds: number) {
        this.elapsedSeconds += deltaSeconds;
        this.stellarObjects = stellarObjects;

        this.onBindObservable.addOnce(() => {
            setStellarObjectUniforms(this.getEffect(), this.stellarObjects);
            this.getEffect().setFloat(GasPlanetMaterialUniformNames.TIME, this.elapsedSeconds % 100000);
        });
    }

    public dispose(forceDisposeEffect?: boolean, forceDisposeTextures?: boolean, notBoundToMesh?: boolean) {
        super.dispose(forceDisposeEffect, forceDisposeTextures, notBoundToMesh);
        this.stellarObjects.length = 0;
    }
}
