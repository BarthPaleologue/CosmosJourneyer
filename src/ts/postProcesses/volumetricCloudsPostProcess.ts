import volumetricCloudsFragment from "../../shaders/volumetricCloudsFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { TelluricPlanemo } from "../planemos/telluricPlanemo/telluricPlanemo";
import { ObjectPostProcess } from "./objectPostProcess";
import { CloudUniforms, FlatCloudsPostProcess } from "./flatCloudsPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { UniformEnumType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/types";
import { StellarObject } from "../stellarObjects/stellarObject";

const shaderName = "volumetricClouds";
Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;

export type CloudsPostProcess = FlatCloudsPostProcess | VolumetricCloudsPostProcess;

export class VolumetricCloudsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly cloudUniforms: CloudUniforms;
    readonly object: TelluricPlanemo;

    constructor(name: string, planet: TelluricPlanemo, cloudLayerHeight: number, scene: UberScene, stars: StellarObject[]) {
        const cloudUniforms: CloudUniforms = {
            layerRadius: planet.getBoundingRadius() + cloudLayerHeight,
            specularPower: 2,
            smoothness: 0.9,
            frequency: 4,
            detailFrequency: 20,
            coverage: 0.8 * Math.exp(-planet.model.physicalProperties.waterAmount * planet.model.physicalProperties.pressure),
            sharpness: 3.5,
            color: new Color3(0.8, 0.8, 0.8),
            worleySpeed: 0.0005,
            detailSpeed: 0.003
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "cloudLayerMinHeight",
                type: UniformEnumType.Float,
                get: () => {
                    return planet.getBoundingRadius();
                }
            },
            {
                name: "cloudLayerMaxHeight",
                type: UniformEnumType.Float,
                get: () => {
                    return planet.getBoundingRadius() + 30e3;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.cloudUniforms = cloudUniforms;
    }
}
