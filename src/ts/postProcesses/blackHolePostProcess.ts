import blackHoleFragment from "../../shaders/blackhole.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { Assets } from "../assets";
import { Effect } from "@babylonjs/core/Materials/effect";
import { getForwardDirection } from "../uberCore/transforms/basicTransform";
import { UniformEnumType, ShaderSamplers, ShaderUniforms, SamplerEnumType } from "../uberCore/postProcesses/types";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";

export type BlackHoleUniforms = {
    accretionDiskRadius: number;
    rotationPeriod: number;
    time: number;
};

export class BlackHolePostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly blackHoleUniforms: BlackHoleUniforms;
    readonly object: BlackHole;

    constructor(blackHole: BlackHole, scene: UberScene, starfieldRotation: Quaternion) {
        const shaderName = "blackhole";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;
        }

        const blackHoleUniforms: BlackHoleUniforms = {
            accretionDiskRadius: blackHole.model.physicalProperties.accretionDiskRadius,
            rotationPeriod: 1.5,
            time: 0
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
                    return rotationMatrix;
                }
            },
            {
                name: "time",
                type: UniformEnumType.Float,
                get: () => {
                    return blackHoleUniforms.time % (blackHoleUniforms.rotationPeriod * 10000);
                }
            },
            {
                name: "accretionDiskRadius",
                type: UniformEnumType.Float,
                get: () => {
                    return blackHoleUniforms.accretionDiskRadius;
                }
            },
            {
                name: "rotationPeriod",
                type: UniformEnumType.Float,
                get: () => {
                    return blackHoleUniforms.rotationPeriod;
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
        this.blackHoleUniforms = blackHoleUniforms;
    }

    public update(deltaTime: number): void {
        this.blackHoleUniforms.time += deltaTime;
    }
}
