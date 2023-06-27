import blackHoleFragment from "../../shaders/blackhole.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms, UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { BlackHole } from "../bodies/stellarObjects/blackHole";
import { ObjectPostProcess } from "./objectPostProcess";
import { Assets } from "../assets";
import { Effect } from "@babylonjs/core/Materials/effect";

const shaderName = "blackhole";
Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;

export interface BlackHoleSettings {
    accretionDiskRadius: number;
    rotationPeriod: number;
}

export class BlackHolePostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: BlackHoleSettings;
    readonly object: BlackHole;

    constructor(name: string, blackHole: BlackHole, scene: UberScene) {
        const settings: BlackHoleSettings = {
            accretionDiskRadius: blackHole.model.physicalProperties.accretionDiskRadius,
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(blackHole),
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
            },
            {
                name: "forwardAxis",
                type: ShaderDataType.Vector3,
                get: () => {
                    return blackHole.transform.getForwardDirection();
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

        super(name, shaderName, uniforms, samplers, scene);

        this.object = blackHole;
        this.settings = settings;
    }
}
