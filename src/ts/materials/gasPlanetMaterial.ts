import { AbstractController } from "../uberCore/abstractController";

import surfaceMaterialFragment from "../../shaders/gasPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../shaders/gasPlanetMaterial/vertex.glsl";
import { GazColorSettings } from "./colorSettingsInterface";
import { normalRandom, randRange, randRangeInt } from "extended-random";
import { flattenVector3Array } from "../utils/algebra";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { GasPlanetDescriptor } from "../descriptors/planemos/gasPlanetDescriptor";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Scene } from "@babylonjs/core/scene";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MaterialHelper } from "@babylonjs/core/Materials/materialHelper";

const shaderName = "gazPlanetMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class GasPlanetMaterial extends ShaderMaterial {
    readonly planet: BasicTransform;
    readonly colorSettings: GazColorSettings;
    private clock = 0;

    constructor(planetName: string, planet: BasicTransform, descriptor: GasPlanetDescriptor, scene: Scene) {
        super(`${planetName}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal", "uv"],
            uniforms: [
                "world",
                "worldViewProjection",
                "projection",
                "view",

                "seed",

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
                "rotationMatrixAroundAxis",

                "playerPosition",

                "logarithmicDepthConstant"
            ],
            defines: ["#define LOGARITHMICDEPTH"]
        });

        this.planet = planet;

        const hue1 = normalRandom(240, 20, descriptor.rng, 70);
        const hue2 = normalRandom(0, 20, descriptor.rng, 72);

        const divergence = 25;

        const color1 = Color3.FromHSV(hue1 % 360, randRange(0.4, 0.9, descriptor.rng, 72), randRange(0.7, 0.9, descriptor.rng, 73));
        const color2 = Color3.FromHSV(hue2 % 360, randRange(0.6, 0.9, descriptor.rng, 74), randRange(0.1, 0.9, descriptor.rng, 75));
        const color3 = Color3.FromHSV((hue1 + divergence) % 360, randRange(0.4, 0.9, descriptor.rng, 76), randRange(0.7, 0.9, descriptor.rng, 77));
        const color4 = Color3.FromHSV((hue2 + divergence) % 360, randRange(0.6, 0.9, descriptor.rng, 78), randRange(0.1, 0.9, descriptor.rng, 79));

        this.colorSettings = {
            color1: color1,
            color2: color2,
            color3: color3,
            color4: color4,
            colorSharpness: randRangeInt(40, 80, descriptor.rng, 80) / 10
        };

        this.onBindObservable.add(() => {
            const effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setFloat("seed", descriptor.seed);

        this.setVector3("playerPosition", Vector3.Zero());
        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
        this.setFloat("planetRadius", descriptor.radius);

        this.setColor3("color1", this.colorSettings.color1);
        this.setColor3("color2", this.colorSettings.color2);
        this.setColor3("color3", this.colorSettings.color3);
        this.setColor3("color4", this.colorSettings.color4);

        this.updateManual();
    }

    public updateManual(): void {
        this.setFloat("colorSharpness", this.colorSettings.colorSharpness);
    }

    public update(player: AbstractController, stellarObjects: StellarObject[], rotationMatrixAroundAxis: Matrix, deltaTime: number) {
        this.clock += deltaTime;

        this.setQuaternion("planetInverseRotationQuaternion", this.planet.getInverseRotationQuaternion());
        this.setMatrix("rotationMatrixAroundAxis", rotationMatrixAroundAxis);

        this.setVector3("playerPosition", player.transform.getAbsolutePosition());

        this.setArray3("starPositions", flattenVector3Array(stellarObjects.map((star) => star.transform.getAbsolutePosition())));
        this.setInt("nbStars", stellarObjects.length);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());

        this.setFloat("time", this.clock % 100000);
    }
}
