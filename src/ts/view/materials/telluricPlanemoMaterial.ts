import { ColorMode, ColorSettings } from "./colorSettingsInterface";

import surfaceMaterialFragment from "../../../shaders/telluricPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../../shaders/telluricPlanetMaterial/vertex.glsl";
import { Assets } from "../../controller/assets";
import { flattenVector3Array } from "../../utils/algebra";
import { UberScene } from "../../controller/uberCore/uberScene";
import { TerrainSettings } from "../../model/terrain/terrainSettings";
import { SolidPhysicalProperties } from "../../model/common";
import { centeredRand } from "extended-random";
import { TelluricPlanemoModel } from "../../model/planemos/telluricPlanemoModel";
import { Effect } from "@babylonjs/core/Materials/effect";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MaterialHelper } from "@babylonjs/core/Materials/materialHelper";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { TransformNode } from "@babylonjs/core/Meshes";
import { getInverseRotationMatrix } from "../../controller/uberCore/transforms/basicTransform";
import {Star} from "../bodies/stellarObjects/star";
import {StellarObject} from "../bodies/stellarObjects/stellarObject";

const shaderName = "surfaceMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class TelluricPlanemoMaterial extends ShaderMaterial {
    readonly planet: TransformNode;
    colorSettings: ColorSettings;
    terrainSettings: TerrainSettings;
    physicalProperties: SolidPhysicalProperties;
    planetRadius: number;

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

                "waterAmount",

                "logarithmicDepthConstant"
            ],
            defines: ["#define LOGARITHMICDEPTH"]
        });

        this.planet = planet;
        this.planetRadius = model.radius;
        this.terrainSettings = model.terrainSettings;
        this.physicalProperties = model.physicalProperties;
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

        this.onBindObservable.add(() => {
            const effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setFloat("seed", model.seed);

        if (!Assets.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.setColor3("snowColor", this.colorSettings.snowColor);
        this.setColor3("steepColor", this.colorSettings.steepColor);
        this.setColor3("plainColor", this.colorSettings.plainColor);
        this.setColor3("beachColor", this.colorSettings.beachColor);
        this.setColor3("desertColor", this.colorSettings.desertColor);
        this.setColor3("bottomColor", this.colorSettings.bottomColor);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());

        this.updateConstants();
    }

    public updateConstants(): void {
        this.setFloat("planetRadius", this.planetRadius);

        this.setInt("colorMode", this.colorSettings.mode);

        this.setFloat("waterLevel", this.physicalProperties.oceanLevel);
        this.setFloat("beachSize", this.colorSettings.beachSize);
        this.setFloat("steepSharpness", this.colorSettings.steepSharpness);

        this.setFloat("normalSharpness", this.colorSettings.normalSharpness);

        this.setTexture("bottomNormalMap", Assets.BottomNormalMap);
        this.setTexture("steepNormalMap", Assets.RockNormalMap);
        this.setTexture("plainNormalMap", Assets.GrassNormalMap);
        this.setTexture("snowNormalMap", Assets.SnowNormalMap1);
        this.setTexture("beachNormalMap", Assets.SandNormalMap1);
        this.setTexture("desertNormalMap", Assets.SandNormalMap2);

        this.setFloat("minTemperature", this.physicalProperties.minTemperature);
        this.setFloat("maxTemperature", this.physicalProperties.maxTemperature);
        this.setFloat("pressure", this.physicalProperties.pressure);
        this.setFloat("waterAmount", this.physicalProperties.waterAmount);

        this.setFloat("maxElevation", this.terrainSettings.continent_base_height + this.terrainSettings.max_mountain_height + this.terrainSettings.max_bump_height);
    }

    public update(activeControllerPosition: Vector3, stellarObjects: StellarObject[]) {
        this.planet.updateCache(true);

        this.setMatrix("normalMatrix", this.planet.getWorldMatrix().clone().invert().transpose());
        this.setMatrix("planetInverseRotationMatrix", getInverseRotationMatrix(this.planet));

        this.setVector3("playerPosition", activeControllerPosition);

        for (let i = 0; i < stellarObjects.length; i++) {
            const star = stellarObjects[i];
            this.setVector3(`stars[${i}].position`, star.transform.getAbsolutePosition());
            this.setVector3(`stars[${i}].color`, star instanceof Star ? star.model.surfaceColor : Vector3.One());
        }
        this.setInt("nbStars", stellarObjects.length);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
    }
}
