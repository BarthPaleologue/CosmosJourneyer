import { Color3, Effect, MaterialHelper, Scene, ShaderMaterial, Vector3 } from "@babylonjs/core";
import { PlayerController } from "../player/playerController";

import surfaceMaterialFragment from "../../shaders/gasPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../shaders/gasPlanetMaterial/vertex.glsl";
import { GasPlanet } from "../bodies/planets/gasPlanet";
import { GazColorSettings } from "./colorSettingsInterface";
import { normalRandom, randRange, randRangeInt } from "extended-random";
import { flattenVector3Array } from "../utils/algebra";

const shaderName = "gazPlanetMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class GasPlanetMaterial extends ShaderMaterial {
    readonly planet: GasPlanet;
    readonly colorSettings: GazColorSettings;

    constructor(planet: GasPlanet, scene: Scene) {
        super(`${planet.name}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                "world",
                "worldViewProjection",
                "projection",
                "view",

                "textureSampler",
                "depthSampler",

                "seed",

                "cameraNear",
                "cameraFar",
                "planetPosition",
                "planetRadius",

                "starPositions",
                "nbStars",

                "color1",
                "color2",
                "color3",
                "color4",
                "colorSharpness",

                "time",

                "planetInverseRotationQuaternion",

                "playerPosition",

                "logarithmicDepthConstant"
            ],
            defines: ["#define LOGARITHMICDEPTH"]
        });

        this.planet = planet;

        const hue1 = normalRandom(240, 20, this.planet.rng as (step?: number) => number, 70);
        const hue2 = normalRandom(0, 20, this.planet.rng as (step?: number) => number, 72);

        const divergence = 25;

        const color1 = Color3.FromHSV(hue1 % 360, randRange(0.4, 0.9, this.planet.rng, 72), randRange(0.7, 0.9, this.planet.rng, 73));
        const color2 = Color3.FromHSV(hue2 % 360, randRange(0.6, 0.9, this.planet.rng, 74), randRange(0.1, 0.9, this.planet.rng, 75));
        const color3 = Color3.FromHSV((hue1 + divergence) % 360, randRange(0.4, 0.9, this.planet.rng, 76), randRange(0.7, 0.9, this.planet.rng, 77));
        const color4 = Color3.FromHSV((hue2 + divergence) % 360, randRange(0.6, 0.9, this.planet.rng, 78), randRange(0.1, 0.9, this.planet.rng, 79));

        this.colorSettings = {
            color1: color1,
            color2: color2,
            color3: color3,
            color4: color4,
            colorSharpness: randRangeInt(40, 80, this.planet.rng, 80) / 10
        };

        this.onBindObservable.add(() => {
            const effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setFloat("seed", this.planet.seed);

        this.setVector3("playerPosition", Vector3.Zero());
        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
        this.setFloat("planetRadius", this.planet.getRadius());

        this.setArray3("starPositions", flattenVector3Array(this.planet.starSystem.stars.map((star) => star.getAbsolutePosition())));
        this.setInt("nbStars", this.planet.starSystem.stars.length);

        this.setColor3("color1", this.colorSettings.color1);
        this.setColor3("color2", this.colorSettings.color2);
        this.setColor3("color3", this.colorSettings.color3);
        this.setColor3("color4", this.colorSettings.color4);

        this.updateManual();
    }

    public updateManual(): void {
        this.setFloat("colorSharpness", this.colorSettings.colorSharpness);
    }

    public update(player: PlayerController) {
        this.setQuaternion("planetInverseRotationQuaternion", this.planet.getInverseRotationQuaternion());
        this.setVector3("playerPosition", player.getAbsolutePosition());

        this.setArray3("starPositions", flattenVector3Array(this.planet.starSystem.stars.map((star) => star.getAbsolutePosition())));
        this.setInt("nbStars", this.planet.starSystem.stars.length);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());

        this.setFloat("time", this.planet.starSystem.getTime() % 100000);
    }
}
