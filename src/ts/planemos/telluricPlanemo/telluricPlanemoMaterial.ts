import { ColorMode, ColorSettings } from "./colorSettingsInterface";

import surfaceMaterialFragment from "../../../shaders/telluricPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../../shaders/telluricPlanetMaterial/vertex.glsl";
import { Assets } from "../../assets";
import { UberScene } from "../../uberCore/uberScene";
import { centeredRand } from "extended-random";
import { TelluricPlanemoModel } from "./telluricPlanemoModel";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getInverseRotationMatrix } from "../../uberCore/transforms/basicTransform";
import { StellarObject } from "../../stellarObjects/stellarObject";
import { Star } from "../../stellarObjects/star/star";

const shaderName = "surfaceMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

/**
 * The material for telluric planemos.
 * It is responsible for the shading of the surface of the planet (biome blending, normal mapping and color)
 */
export class TelluricPlanemoMaterial extends ShaderMaterial {
    /**
     * The transform node of the planemo associated with this material
     */
    private readonly planemoTransform: TransformNode;

    readonly colorSettings: ColorSettings;

    /**
     * The model of the planemo associated with this material
     */
    private readonly planemoModel: TelluricPlanemoModel;

    /**
     * Creates a new telluric planemo material
     * @param planetName The name of the planemo
     * @param planet The transform node of the planemo
     * @param model The model of the planemo associated with this material
     * @param scene
     */
    constructor(planetName: string, planet: TransformNode, model: TelluricPlanemoModel, scene: UberScene) {
        super(`${planetName}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [
                "world",
                "worldViewProjection",
                "projection",
                "view",
                "normalMatrix",

                "colorMode",

                "bottomNormalMap",
                "plainNormalMap",
                "beachNormalMap",
                "desertNormalMap",
                "snowNormalMap",
                "steepNormalMap",

                "seed",

                "cameraNear",
                "cameraFar",
                "planetPosition",
                "planetRadius",

                "stars",
                "nbStars",

                "planetInverseRotationMatrix",

                "playerPosition",

                "waterLevel",
                "beachSize",
                "steepSharpness",
                "normalSharpness",

                "snowColor",
                "steepColor",
                "plainColor",
                "beachColor",
                "desertColor",
                "bottomColor",

                "maxElevation",

                "minTemperature",
                "maxTemperature",
                "pressure",

                "waterAmount"
            ]
        });

        this.planemoModel = model;
        this.planemoTransform = planet;

        this.colorSettings = {
            mode: ColorMode.DEFAULT,

            snowColor: new Color3(0.7, 0.7, 0.7),
            steepColor: new Color3(115, 100, 100).scaleInPlace(1 / 255),
            plainColor: new Color3(
                //TODO: make this better
                Math.max(0.22 + centeredRand(model.rng, 82) / 20, 0),
                Math.max(0.37 + centeredRand(model.rng, 83) / 20, 0),
                Math.max(0.024 + centeredRand(model.rng, 84) / 20, 0)
            ),
            beachColor: new Color3(132, 114, 46).scaleInPlace(1 / 255),
            desertColor: new Color3(178, 107, 42).scaleInPlace(1 / 255),
            bottomColor: new Color3(0.5, 0.5, 0.5),

            beachSize: 250 + 100 * centeredRand(model.rng, 85),
            steepSharpness: 2,
            normalSharpness: 0.5
        };

        if (model.physicalProperties.oceanLevel === 0) {
            this.colorSettings.plainColor = this.colorSettings.desertColor.scale(0.7);
        }

        this.setFloat("seed", model.seed);

        if (!Assets.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.setColor3("snowColor", this.colorSettings.snowColor);
        this.setColor3("steepColor", this.colorSettings.steepColor);
        this.setColor3("plainColor", this.colorSettings.plainColor);
        this.setColor3("beachColor", this.colorSettings.beachColor);
        this.setColor3("desertColor", this.colorSettings.desertColor);
        this.setColor3("bottomColor", this.colorSettings.bottomColor);

        this.setVector3("planetPosition", this.planemoTransform.getAbsolutePosition());

        this.updateConstants();
    }

    public updateConstants(): void {
        this.setFloat("planetRadius", this.planemoModel.radius);

        this.setInt("colorMode", this.colorSettings.mode);

        this.setFloat("waterLevel", this.planemoModel.physicalProperties.oceanLevel);
        this.setFloat("beachSize", this.colorSettings.beachSize);
        this.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        this.setTexture("bottomNormalMap", Assets.BottomNormalMap);
        this.setTexture("steepNormalMap", Assets.RockNormalMap);
        this.setTexture("plainNormalMap", Assets.GrassNormalMap);
        this.setTexture("snowNormalMap", Assets.SnowNormalMap1);
        this.setTexture("beachNormalMap", Assets.SandNormalMap1);
        this.setTexture("desertNormalMap", Assets.SandNormalMap2);

        this.setFloat("minTemperature", this.planemoModel.physicalProperties.minTemperature);
        this.setFloat("maxTemperature", this.planemoModel.physicalProperties.maxTemperature);
        this.setFloat("pressure", this.planemoModel.physicalProperties.pressure);
        this.setFloat("waterAmount", this.planemoModel.physicalProperties.waterAmount);

        this.setFloat(
            "maxElevation",
            this.planemoModel.terrainSettings.continent_base_height + this.planemoModel.terrainSettings.max_mountain_height + this.planemoModel.terrainSettings.max_bump_height
        );
    }

    public update(activeControllerPosition: Vector3, stellarObjects: StellarObject[]) {
        this.setMatrix("normalMatrix", this.planemoTransform.getWorldMatrix().clone().invert().transpose());
        this.setMatrix("planetInverseRotationMatrix", getInverseRotationMatrix(this.planemoTransform));

        this.setVector3("playerPosition", activeControllerPosition);

        for (let i = 0; i < stellarObjects.length; i++) {
            const star = stellarObjects[i];
            this.setVector3(`stars[${i}].position`, star.getTransform().getAbsolutePosition());
            this.setVector3(`stars[${i}].color`, star instanceof Star ? star.model.surfaceColor : Vector3.One());
        }
        this.setInt("nbStars", stellarObjects.length);

        this.setVector3("planetPosition", this.planemoTransform.getAbsolutePosition());
    }
}
