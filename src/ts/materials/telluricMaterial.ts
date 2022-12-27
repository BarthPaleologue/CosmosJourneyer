import { Color3, Effect, MaterialHelper, ShaderMaterial } from "@babylonjs/core";
import { ColorMode, ColorSettings } from "./colorSettingsInterface";

import surfaceMaterialFragment from "../../shaders/telluricPlanetMaterial/fragment.glsl";
import surfaceMaterialVertex from "../../shaders/telluricPlanetMaterial/vertex.glsl";
import { Assets } from "../assets";
import { flattenVector3Array } from "../utils/algebra";
import { UberScene } from "../uberCore/uberScene";
import { Star } from "../bodies/stars/star";
import { AbstractController } from "../uberCore/abstractController";
import { BlackHole } from "../bodies/blackHole";
import { BasicTransform } from "../uberCore/transforms/basicTransform";
import { TerrainSettings } from "../terrain/terrainSettings";
import { SolidPhysicalProperties } from "../bodies/physicalProperties";
import { centeredRand } from "extended-random";
import { TelluricPlanetDescriptor } from "../descriptors/telluricPlanetDescriptor";

const shaderName = "surfaceMaterial";
Effect.ShadersStore[`${shaderName}FragmentShader`] = surfaceMaterialFragment;
Effect.ShadersStore[`${shaderName}VertexShader`] = surfaceMaterialVertex;

export class TelluricMaterial extends ShaderMaterial {
    readonly planet: BasicTransform;
    colorSettings: ColorSettings;
    terrainSettings: TerrainSettings;
    physicalProperties: SolidPhysicalProperties;
    planetRadius: number;

    constructor(
        planetName: string,
        planet: BasicTransform,
        planetRadius: number,
        planetDescriptor: TelluricPlanetDescriptor,
        terrainSettings: TerrainSettings,
        physicalProperties: SolidPhysicalProperties,
        scene: UberScene
    ) {
        super(`${planetName}SurfaceColor`, scene, shaderName, {
            attributes: ["position", "normal"],
            uniforms: [
                "world",
                "worldViewProjection",
                "projection",
                "view",
                "normalMatrix",

                "textureSampler",
                "depthSampler",

                "colorMode",

                "bottomNormalMap",
                "plainNormalMap",
                "beachNormalMap",
                "desertNormalMap",
                "snowNormalMap",
                "snowNormalMap2",
                "steepNormalMap",

                "seed",

                "cameraNear",
                "cameraFar",
                "planetPosition",
                "planetRadius",

                "starPositions",
                "nbStars",

                "planetInverseRotationQuaternion",

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
        this.planetRadius = planetRadius;
        this.terrainSettings = terrainSettings;
        this.physicalProperties = physicalProperties;
        this.colorSettings = {
            mode: ColorMode.DEFAULT,

            snowColor: new Color3(1, 1, 1),
            steepColor: new Color3(115, 100, 100).scaleInPlace(1 / 255),
            //plainColor: plainColor: new Color3(56, 94, 6).scaleInPlace(1 / 255),
            plainColor: new Color3(
                //TODO: make this better
                Math.max(0.22 + centeredRand(planetDescriptor.rng, 82) / 20, 0),
                Math.max(0.37 + centeredRand(planetDescriptor.rng, 83) / 20, 0),
                Math.max(0.024 + centeredRand(planetDescriptor.rng, 84) / 20, 0)
            ),
            beachColor: new Color3(132, 114, 46).scaleInPlace(1 / 255),
            desertColor: new Color3(178, 107, 42).scaleInPlace(1 / 255),
            bottomColor: new Color3(0.5, 0.5, 0.5),

            beachSize: 250 + 100 * centeredRand(planetDescriptor.rng, 85),
            steepSharpness: 2,
            normalSharpness: 0.5
        };

        this.onBindObservable.add(() => {
            const effect = this.getEffect();
            MaterialHelper.BindLogDepth(null, effect, scene);
        });

        this.setFloat("seed", planetDescriptor.seed);

        if (!Assets.IS_READY) throw new Error("You must initialize your assets using the AssetsManager");

        this.setColor3("snowColor", this.colorSettings.snowColor);
        this.setColor3("steepColor", this.colorSettings.steepColor);
        this.setColor3("plainColor", this.colorSettings.plainColor);
        this.setColor3("beachColor", this.colorSettings.beachColor);
        this.setColor3("desertColor", this.colorSettings.desertColor);
        this.setColor3("bottomColor", this.colorSettings.bottomColor);

        this.setVector3("playerPosition", scene.getActiveController().getActiveCamera().position);

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
        this.setTexture("snowNormalMap2", Assets.SnowNormalMap2);

        this.setTexture("beachNormalMap", Assets.SandNormalMap1);
        this.setTexture("desertNormalMap", Assets.SandNormalMap2);

        this.setFloat("minTemperature", this.physicalProperties.minTemperature);
        this.setFloat("maxTemperature", this.physicalProperties.maxTemperature);
        this.setFloat("pressure", this.physicalProperties.pressure);
        this.setFloat("waterAmount", this.physicalProperties.waterAmount);

        this.setFloat("maxElevation", this.terrainSettings.continent_base_height + this.terrainSettings.max_mountain_height + this.terrainSettings.max_bump_height);
    }

    public update(activeController: AbstractController, stars: (Star | BlackHole)[]) {
        this.setMatrix("normalMatrix", this.planet.node.getWorldMatrix().clone().invert().transpose());

        this.setQuaternion("planetInverseRotationQuaternion", this.planet.getInverseRotationQuaternion());
        this.setVector3("playerPosition", activeController.transform.getAbsolutePosition());

        this.setArray3("starPositions", flattenVector3Array(stars.map((star) => star.transform.getAbsolutePosition())));
        this.setInt("nbStars", stars.length);

        this.setVector3("planetPosition", this.planet.getAbsolutePosition());
    }
}
