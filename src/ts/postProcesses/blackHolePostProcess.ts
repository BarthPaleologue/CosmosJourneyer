import { Effect, Matrix, Vector3 } from "@babylonjs/core";

import blackHoleFragment from "../../shaders/blackhole.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getBodyUniforms, getSamplers } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { BlackHole } from "../bodies/stars/blackHole";
import { BodyPostProcess } from "./bodyPostProcess";
import { Assets } from "../assets";

const shaderName = "blackhole";
Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;

export interface BlackHoleSettings {
    accretionDiskRadius: number;
    rotationPeriod: number;
}

export class BlackHolePostProcess extends BodyPostProcess {
    settings: BlackHoleSettings;

    constructor(name: string, blackHole: BlackHole, scene: UberScene) {
        const settings: BlackHoleSettings = {
            accretionDiskRadius: 8000e3,
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            ...getBodyUniforms(blackHole),
            ...getActiveCameraUniforms(scene),
            {
                name: "time",
                type: ShaderDataType.Float,
                get: () => {
                    return this.internalTime % (settings.rotationPeriod * 10000);
                }
            },
            {
                name: "accretionDiskRadius",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.accretionDiskRadius;
                }
            },
            {
                name: "rotationPeriod",
                type: ShaderDataType.Float,
                get: () => {
                    return settings.rotationPeriod;
                }
            },
            {
                name: "rotationAxis",
                type: ShaderDataType.Vector3,
                get: () => {
                    return blackHole.getRotationAxis();
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "starfieldTexture",
                type: ShaderDataType.Texture,
                get: () => {
                    return Assets.Starfield;
                }
            }
        ];

        super(name, blackHole, shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
