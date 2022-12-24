import {Color3, Effect} from "@babylonjs/core";

import volumetricCloudsFragment from "../../shaders/volumetricCloudsFragment.glsl";
import {UberScene} from "../uberCore/uberScene";
import {getActiveCameraUniforms, getBodyUniforms, getSamplers, getStarsUniforms} from "./uniforms";
import {ShaderDataType, ShaderSamplers, ShaderUniforms} from "../uberCore/postProcesses/uberPostProcess";
import {BlackHole} from "../bodies/blackHole";
import {Star} from "../bodies/stars/star";
import {TelluricPlanet} from "../bodies/planets/telluricPlanet";
import {BodyPostProcess} from "./bodyPostProcess";
import {CloudSettings, FlatCloudsPostProcess} from "./flatCloudsPostProcess";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export type CloudsPostProcess = FlatCloudsPostProcess | VolumetricCloudsPostProcess;

export class VolumetricCloudsPostProcess extends BodyPostProcess {
    settings: CloudSettings;

    constructor(name: string, planet: TelluricPlanet, cloudLayerHeight: number, scene: UberScene, stars: (Star | BlackHole)[]) {
        const settings: CloudSettings = {
            cloudLayerRadius: planet.getApparentRadius() + cloudLayerHeight,
            specularPower: 2,
            smoothness: 0.9,
            cloudFrequency: 4,
            cloudDetailFrequency: 20,
            cloudCoverage: 0.8 * Math.exp(-planet.physicalProperties.waterAmount * planet.physicalProperties.pressure),
            cloudSharpness: 3.5,
            cloudColor: new Color3(0.8, 0.8, 0.8),
            worleySpeed: 0.0005,
            detailSpeed: 0.003
        };

        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(planet),
            ...getStarsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
              name: "cloudLayerMinHeight",
              type: ShaderDataType.Float,
              get: () => {
                  return planet.getApparentRadius();
              }
            },
            {
                name: "cloudLayerMaxHeight",
                type: ShaderDataType.Float,
                get: () => {
                    return planet.getApparentRadius() + 30e3;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, planet, shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
