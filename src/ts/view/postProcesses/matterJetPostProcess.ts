import matterJetFragment from "../../shaders/matterjet.glsl";
import { UberScene } from "../../controller/uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms, UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { StellarObject } from "../bodies/stellarObjects/stellarObject";
import { ObjectPostProcess } from "./objectPostProcess";
import { BaseObject } from "../common";
import { getForwardDirection } from "../../controller/uberCore/transforms/basicTransform";

const shaderName = "matterjet";
Effect.ShadersStore[`${shaderName}FragmentShader`] = matterJetFragment;

export interface MatterJetSettings {
    rotationPeriod: number;
}

export class MatterJetPostProcess extends UberPostProcess implements ObjectPostProcess {
    settings: MatterJetSettings;
    object: BaseObject;

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
                    return getForwardDirection(stellarObject.transform);
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene)
        ];

        super(name, shaderName, uniforms, samplers, scene);

        this.object = stellarObject;
        this.settings = settings;
    }
}
