import mandelbulbFragment from "../../shaders/mandelbulb.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { StellarObject } from "../stellarObjects/stellarObject";
import { UniformEnumType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/types";
import { Mandelbulb } from "../mandelbulb/mandelbulb";

export interface MandelbulbSettings {
    rotationPeriod: number;
}

export class MandelbulbPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: MandelbulbSettings;
    readonly object: Mandelbulb;

    constructor(mandelbulb: Mandelbulb, scene: UberScene, stellarObjects: StellarObject[]) {
        const shaderName = "mandelbulb";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = mandelbulbFragment;
        }

        const settings: MandelbulbSettings = {
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(mandelbulb),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            {
                name: "power",
                type: UniformEnumType.Float,
                get: () => {
                    return mandelbulb.model.power;
                }
            },
            {
                name: "accentColor",
                type: UniformEnumType.Color3,
                get: () => {
                    return mandelbulb.model.accentColor;
                }
            }
        ];

        const samplers: ShaderSamplers = [...getSamplers(scene)];

        super(mandelbulb.name, shaderName, uniforms, samplers, scene);

        this.object = mandelbulb;
        this.settings = settings;
    }
}
