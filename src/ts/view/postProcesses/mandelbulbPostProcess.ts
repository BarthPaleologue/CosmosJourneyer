import mandelbulbFragment from "../../../shaders/mandelbulb.glsl";
import { UberScene } from "../../controller/uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Mandelbulb } from "../bodies/planemos/mandelbulb";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import {UniformEnumType, ShaderSamplers, ShaderUniforms} from "../../controller/uberCore/postProcesses/types";

const shaderName = "mandelbulb";
Effect.ShadersStore[`${shaderName}FragmentShader`] = mandelbulbFragment;

export interface MandelbulbSettings {
    rotationPeriod: number;
}

export class MandelbulbPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: MandelbulbSettings;
    readonly object: Mandelbulb;

    constructor(mandelbulb: Mandelbulb, scene: UberScene, stellarObjects: StellarObject[]) {
        const settings: MandelbulbSettings = {
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(mandelbulb),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            {
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    return this.internalTime % (settings.rotationPeriod * 10000);
                }
            },
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