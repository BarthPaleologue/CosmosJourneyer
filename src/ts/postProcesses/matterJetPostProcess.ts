import matterJetFragment from "../../shaders/matterjet.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/uberPostProcess";
import { BodyPostProcess } from "./bodyPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";

const shaderName = "matterjet";
Effect.ShadersStore[`${shaderName}FragmentShader`] = matterJetFragment;

export interface MatterJetSettings {
    rotationPeriod: number;
}

export class MatterJetPostProcess extends BodyPostProcess {
    settings: MatterJetSettings;

    constructor(name: string, stellarObject: StellarObject, scene: UberScene) {
        const settings: MatterJetSettings = {
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(stellarObject),
            ...getActiveCameraUniforms(scene),
            {
                name: "time",
                type: ShaderDataType.Float,
                get: () => {
                    return this.internalTime % (settings.rotationPeriod * 10000);
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
                    return stellarObject.getRotationAxis();
                }
            },
            {
                name: "forwardAxis",
                type: ShaderDataType.Vector3,
                get: () => {
                    return stellarObject.transform.getForwardDirection();
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene)
        ];

        super(name, stellarObject, shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
