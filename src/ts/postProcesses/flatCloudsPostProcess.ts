import { Effect } from "@babylonjs/core/Materials/effect";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { gcd } from "terrain-generation";

import flatCloudsFragment from "../../shaders/flatCloudsFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { TelluricPlanemo } from "../planemos/telluricPlanemo/telluricPlanemo";
import { ObjectPostProcess, UpdatablePostProcess } from "./objectPostProcess";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { ProceduralTexture } from "@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture";
import { Scene } from "@babylonjs/core/scene";
import flatCloudLUT from "../../shaders/textures/flatCloudLUT.glsl";
import { Transformable } from "../uberCore/transforms/basicTransform";

export interface CloudUniforms {
    layerRadius: number;
    smoothness: number;
    specularPower: number;
    frequency: number;
    detailFrequency: number;
    coverage: number;
    sharpness: number;
    color: Color3;
    worleySpeed: number;
    detailSpeed: number;
    time: number;
}

export class FlatCloudsPostProcess extends UberPostProcess implements ObjectPostProcess, UpdatablePostProcess {
    readonly cloudUniforms: CloudUniforms;
    readonly object: TelluricPlanemo;

    public static async CreateAsync(
        name: string,
        planet: TelluricPlanemo,
        cloudLayerHeight: number,
        scene: UberScene,
        stellarObjects: Transformable[]
    ): Promise<FlatCloudsPostProcess> {
        const shaderName = "flatClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;
        }

        const cloudUniforms: CloudUniforms = {
            layerRadius: planet.getBoundingRadius() + cloudLayerHeight,
            specularPower: 2,
            smoothness: 0.7,
            frequency: 4,
            detailFrequency: 12,
            coverage: 0.8 * Math.exp(-planet.model.physicalProperties.waterAmount * planet.model.physicalProperties.pressure),
            sharpness: 3.5,
            color: new Color3(0.8, 0.8, 0.8),
            worleySpeed: 0.0005,
            detailSpeed: 0.003,
            time: 0
        };

        const lut = FlatCloudsPostProcess.CreateLUT(cloudUniforms.frequency, cloudUniforms.detailFrequency, scene);

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            {
                name: "clouds_layerRadius",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.layerRadius;
                }
            },
            {
                name: "clouds_frequency",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.frequency;
                }
            },
            {
                name: "clouds_detailFrequency",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.detailFrequency;
                }
            },
            {
                name: "clouds_coverage",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.coverage;
                }
            },
            {
                name: "clouds_sharpness",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.sharpness;
                }
            },
            {
                name: "clouds_color",
                type: UniformEnumType.Color3,
                get: () => {
                    return cloudUniforms.color;
                }
            },
            {
                name: "clouds_worleySpeed",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.worleySpeed;
                }
            },
            {
                name: "clouds_detailSpeed",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.detailSpeed;
                }
            },
            {
                name: "clouds_smoothness",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.smoothness;
                }
            },
            {
                name: "clouds_specularPower",
                type: UniformEnumType.Float,
                get: () => {
                    return cloudUniforms.specularPower;
                }
            },
            {
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    return -cloudUniforms.time % ((2 * Math.PI * gcd(cloudUniforms.worleySpeed * 10000, cloudUniforms.detailSpeed * 10000)) / cloudUniforms.worleySpeed);
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "lut",
                type: SamplerEnumType.Texture,
                get: () => {
                    return lut;
                }
            }
        ];

        return new Promise((resolve, reject) => {
            lut.executeWhenReady(() => {
                const postProcess = new FlatCloudsPostProcess(name, shaderName, planet, cloudUniforms, uniforms, samplers, scene);

                resolve(postProcess);
            });
        });
    }

    private constructor(
        name: string,
        shaderName: string,
        planet: TelluricPlanemo,
        cloudUniforms: CloudUniforms,
        uniforms: ShaderUniforms,
        samplers: ShaderSamplers,
        scene: UberScene
    ) {
        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.cloudUniforms = cloudUniforms;
    }

    static CreateLUT(worleyFrequency: number, detailFrequency: number, scene: Scene): ProceduralTexture {
        if (Effect.ShadersStore[`flatCloudsLUTFragmentShader`] === undefined) {
            Effect.ShadersStore[`flatCloudsLUTFragmentShader`] = flatCloudLUT;
        }

        const lut = new ProceduralTexture("flatCloudLUT", 4096, "flatCloudsLUT", scene, undefined, true, false);
        lut.setFloat("worleyFrequency", worleyFrequency);
        lut.setFloat("detailFrequency", detailFrequency);
        lut.refreshRate = 0;

        return lut;
    }

    public update(deltaTime: number): void {
        this.cloudUniforms.time += deltaTime;
    }
}
