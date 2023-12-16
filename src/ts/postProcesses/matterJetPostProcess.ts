import matterJetFragment from "../../shaders/matterjet.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { StellarObject } from "../stellarObjects/stellarObject";
import { ObjectPostProcess, UpdatablePostProcess } from "./objectPostProcess";
import { UniformEnumType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/types";
import { BaseObject } from "../bodies/common";

export interface MatterJetUniforms {
    // the rotation period in seconds of the matter jet
    rotationPeriod: number;
    time: number;
}

/**
 * Post process for rendering matter jets that are used by neutron stars for example
 */
export class MatterJetPostProcess extends UberPostProcess implements ObjectPostProcess, UpdatablePostProcess {
    matterJetUniforms: MatterJetUniforms;
    object: BaseObject;

    constructor(name: string, stellarObject: StellarObject, scene: UberScene) {
        const shaderName = "matterjet";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = matterJetFragment;
        }

        const settings: MatterJetUniforms = {
            rotationPeriod: 1.5,
            time: 0
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(stellarObject),
            ...getActiveCameraUniforms(scene),
            {
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    return settings.time % (settings.rotationPeriod * 10000);
                }
            },
            {
                name: "rotationPeriod",
                type: UniformEnumType.Float,
                get: () => {
                    return settings.rotationPeriod;
                }
            },
            {
                name: "rotationAxis",
                type: UniformEnumType.Vector3,
                get: () => {
                    return stellarObject.getRotationAxis();
                }
            }
        ];

        const samplers: ShaderSamplers = [...getSamplers(scene)];

        super(name, shaderName, uniforms, samplers, scene);

        this.object = stellarObject;
        this.matterJetUniforms = settings;
    }

    public update(deltaTime: number): void {
        this.matterJetUniforms.time += deltaTime;
    }
}
