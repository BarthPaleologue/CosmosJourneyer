import blackHoleFragment from "../../../shaders/blackhole.glsl";
import { UberScene } from "../../controller/uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../../controller/uberCore/postProcesses/uberPostProcess";
import { BlackHole } from "../bodies/stellarObjects/blackHole";
import { ObjectPostProcess } from "./objectPostProcess";
import { Assets } from "../../controller/assets";
import { Effect } from "@babylonjs/core/Materials/effect";
import { getForwardDirection } from "../../controller/uberCore/transforms/basicTransform";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../../controller/uberCore/postProcesses/types";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";

const shaderName = "blackhole";
Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;

export type BlackHoleSettings = {
    accretionDiskRadius: number;
    rotationPeriod: number;
};

export class BlackHolePostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly settings: BlackHoleSettings;
    readonly object: BlackHole;

    constructor(blackHole: BlackHole, scene: UberScene, starfieldRotation: Quaternion) {
        const settings: BlackHoleSettings = {
            accretionDiskRadius: blackHole.model.physicalProperties.accretionDiskRadius,
            rotationPeriod: 1.5
        };

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(blackHole),
            ...getActiveCameraUniforms(scene),
            {
                name: "starfieldRotation",
                type: UniformEnumType.Matrix,
                get: () => {
                    const rotationMatrix = new Matrix();
                    starfieldRotation.toRotationMatrix(rotationMatrix);
                    console.log(starfieldRotation);
                    return rotationMatrix;
                }
            },
            {
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    return this.internalTime % (settings.rotationPeriod * 10000);
                }
            },
            {
                name: "accretionDiskRadius",
                type: UniformEnumType.Float,
                get: () => {
                    return settings.accretionDiskRadius;
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
                    return blackHole.getRotationAxis();
                }
            },
            {
                name: "forwardAxis",
                type: UniformEnumType.Vector3,
                get: () => {
                    return getForwardDirection(blackHole.getTransform());
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "starfieldTexture",
                type: SamplerEnumType.Texture,
                get: () => {
                    return Assets.Starfield;
                }
            }
        ];

        super(blackHole.name, shaderName, uniforms, samplers, scene);

        this.object = blackHole;
        this.settings = settings;
    }
}
