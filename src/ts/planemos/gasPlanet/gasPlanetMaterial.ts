import { AbstractController } from "../../uberCore/abstractController";

import surfaceMaterialFragment from "../../../shaders/gasPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../../shaders/gasPlanetMaterial/vertex.glsl";
import { GazColorSettings } from "../telluricPlanemo/colorSettingsInterface";
import { normalRandom, randRange, randRangeInt } from "extended-random";
import { GasPlanetModel } from "./gasPlanetModel";
import { StellarObject } from "../../stellarObjects/stellarObject";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes";
import { Star } from "../../stellarObjects/star/star";
import { flattenVector3Array } from "../../utils/algebra";

export class GasPlanetMaterial extends ShaderMaterial {
    readonly planet: TransformNode;
    readonly colorSettings: GazColorSettings;
    private clock = 0;

    constructor(planetName: string, planet: TransformNode, model: GasPlanetModel, scene: Scene) {
        const shaderName = "gasPlanetMaterial";
        if(Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
        }
        if(Effect.ShadersStore[`${shaderName}VertexShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;
        }

        super(`${planetName}GasSurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldViewProjection", "normalMatrix", "seed", "star_positions", "star_colors", "nbStars", "color1", "color2", "color3", "colorSharpness", "time", "playerPosition"]
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
    }

    public updateConstants(): void {
        this.setFloat("colorSharpness", this.colorSettings.colorSharpness);
    }

    public update(player: AbstractController, stellarObjects: StellarObject[], deltaTime: number) {
        this.clock += deltaTime;

        this.setMatrix("normalMatrix", this.planet.getWorldMatrix().clone().invert().transpose());

        this.setVector3("playerPosition", player.getActiveCamera().getAbsolutePosition());

        this.setArray3("star_positions", flattenVector3Array(stellarObjects.map(star => star.getTransform().getAbsolutePosition())));
        this.setArray3("star_colors", flattenVector3Array(stellarObjects.map(star => star instanceof Star ? star.model.surfaceColor : Vector3.One())))
        this.setInt("nbStars", stellarObjects.length);

        this.setFloat("time", this.clock % 100000);
    }
}
