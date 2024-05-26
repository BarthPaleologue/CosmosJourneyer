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
import { Star } from "../../stellarObjects/star/star";
import { flattenColor3Array, flattenVector3Array } from "../../utils/algebra";
import { Transformable } from "../../architecture/transformable";

export class GasPlanetMaterial extends ShaderMaterial {
    readonly planet: TransformNode;
    readonly colorSettings: GazColorSettings;
    private clock = 0;

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
            uniforms: [
                "world",
                "view",
                "worldViewProjection",
                "cameraPosition",
                "seed",
                "star_positions",
                "star_colors",
                "nbStars",
                "color1",
                "color2",
                "color3",
                "colorSharpness",
                "time"
            ]
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

        this.setFloat("seed", model.seed);

        this.setColor3("color1", this.colorSettings.color1);
        this.setColor3("color2", this.colorSettings.color2);
        this.setColor3("color3", this.colorSettings.color3);

        this.updateConstants();

        this.onBindObservable.add((mesh) => {
            const activeCamera = mesh.getScene().activeCamera;
            if(activeCamera === null) throw new Error("No active camera in the scene");
            this.getEffect().setVector3("cameraPosition", activeCamera.globalPosition);
        });
    }

    public updateConstants(): void {
        this.setFloat("colorSharpness", this.colorSettings.colorSharpness);
    }

    public update(stellarObjects: Transformable[], deltaTime: number) {
        this.clock += deltaTime;
        this.stellarObjects = stellarObjects;

        this.onBindObservable.addOnce(() => {
            this.getEffect().setArray3("star_positions", flattenVector3Array(this.stellarObjects.map((star) => star.getTransform().getAbsolutePosition())));
            this.getEffect().setArray3("star_colors", flattenColor3Array(this.stellarObjects.map((star) => (star instanceof Star ? star.model.color : Color3.White()))));
            this.getEffect().setInt("nbStars", this.stellarObjects.length);

            this.getEffect().setFloat("time", this.clock % 100000);
        });
    }
}
