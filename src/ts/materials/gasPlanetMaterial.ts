import { Color3, Effect, MaterialHelper, Scene, ShaderMaterial, Vector3 } from "@babylonjs/core";
import { AbstractController } from "../controllers/abstractController";

import surfaceMaterialFragment from "../../shaders/gasPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../shaders/gasPlanetMaterial/vertex.glsl";
import { GazColorSettings } from "./colorSettingsInterface";
import { normalRandom, randRange, randRangeInt } from "extended-random";
import { flattenVector3Array } from "../utils/algebra";
import { Star } from "../bodies/stars/star";
import { BlackHole } from "../bodies/blackHole";
import { BasicTransform } from "../core/transforms/basicTransform";

const shaderName = "gazPlanetMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class GasPlanetMaterial extends ShaderMaterial {
    readonly planet: BasicTransform;
    readonly colorSettings: GazColorSettings;

    constructor(planetName: string, planet: BasicTransform, planetRadius: number, seed: number, rng: (step: number) => number, scene: Scene) {
        super(`${planetName}SurfaceColor`, scene, shaderName, {
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

        const hue1 = normalRandom(240, 20, rng, 70);
        const hue2 = normalRandom(0, 20, rng, 72);

        const divergence = 25;

        const color1 = Color3.FromHSV(hue1 % 360, randRange(0.4, 0.9, rng, 72), randRange(0.7, 0.9, rng, 73));
        const color2 = Color3.FromHSV(hue2 % 360, randRange(0.6, 0.9, rng, 74), randRange(0.1, 0.9, rng, 75));
        const color3 = Color3.FromHSV((hue1 + divergence) % 360, randRange(0.4, 0.9, rng, 76), randRange(0.7, 0.9, rng, 77));
        const color4 = Color3.FromHSV((hue2 + divergence) % 360, randRange(0.6, 0.9, rng, 78), randRange(0.1, 0.9, rng, 79));

        this.colorSettings = {
            color1: color1,
            color2: color2,
            color3: color3,
            color4: color4,
            colorSharpness: randRangeInt(40, 80, rng, 80) / 10
        };

        this.onBindObservable.add(() => {
            const effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setFloat("seed", seed);

        this.setVector3("playerPosition", Vector3.Zero());
        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
        this.setFloat("planetRadius", planetRadius);

        this.setColor3("color1", this.colorSettings.color1);
        this.setColor3("color2", this.colorSettings.color2);
        this.setColor3("color3", this.colorSettings.color3);
        this.setColor3("color4", this.colorSettings.color4);

        this.updateManual();
    }

    public updateManual(): void {
        this.setFloat("colorSharpness", this.colorSettings.colorSharpness);
    }

    public update(player: AbstractController, stars: (Star | BlackHole)[]) {
        this.setQuaternion("planetInverseRotationQuaternion", this.planet.getInverseRotationQuaternion());
        this.setVector3("playerPosition", player.transform.getAbsolutePosition());

        this.setArray3("starPositions", flattenVector3Array(stars.map((star) => star.getAbsolutePosition())));
        this.setInt("nbStars", stars.length);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());

        //this.setFloat("time", this.planet.getInternalTime() % 100000);
    }
}
