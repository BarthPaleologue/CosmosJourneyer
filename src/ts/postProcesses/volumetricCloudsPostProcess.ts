import volumetricCloudsFragment from "../../shaders/volumetricCloudsFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms, UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { BlackHole } from "../bodies/stellarObjects/blackHole";
import { Star } from "../bodies/stellarObjects/star";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { ObjectPostProcess } from "./objectPostProcess";
import { CloudSettings, FlatCloudsPostProcess } from "./flatCloudsPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Color3 } from "@babylonjs/core/Maths/math.color";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export type CloudsPostProcess = FlatCloudsPostProcess | VolumetricCloudsPostProcess;

export class VolumetricCloudsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: CloudSettings;
    readonly object: TelluricPlanemo;

    constructor(name: string, planet: TelluricPlanemo, cloudLayerHeight: number, scene: UberScene, stars: (Star | BlackHole)[]) {
        const settings: CloudSettings = {
            cloudLayerRadius: planet.getBoundingRadius() + cloudLayerHeight,
            specularPower: 2,
            smoothness: 0.9,
            cloudFrequency: 4,
            cloudDetailFrequency: 20,
            cloudCoverage: 0.8 * Math.exp(-planet.model.physicalProperties.waterAmount * planet.model.physicalProperties.pressure),
            cloudSharpness: 3.5,
            cloudColor: new Color3(0.8, 0.8, 0.8),
            worleySpeed: 0.0005,
            detailSpeed: 0.003
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "cloudLayerMinHeight",
                type: ShaderDataType.Float,
                get: () => {
                    return planet.getBoundingRadius();
                }
            },
            {
                name: "cloudLayerMaxHeight",
                type: ShaderDataType.Float,
                get: () => {
                    return planet.getBoundingRadius() + 30e3;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.settings = settings;
    }
}
