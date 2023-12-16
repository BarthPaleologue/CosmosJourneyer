import { Effect } from "@babylonjs/core/Materials/effect";

import flatCloudsFragment from "../../../shaders/flatCloudsFragment.glsl";
import { UberScene } from "../../uberCore/uberScene";
import { UberPostProcess } from "../../uberCore/postProcesses/uberPostProcess";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "../uniforms";
import { ObjectPostProcess, UpdatablePostProcess } from "../objectPostProcess";
import { ShaderSamplers, ShaderUniforms } from "../../uberCore/postProcesses/types";
import { Transformable } from "../../uberCore/transforms/basicTransform";
import { CloudsUniforms } from "./cloudsUniforms";
import { BoundingSphere } from "../../bodies/common";

export class FlatCloudsPostProcess extends UberPostProcess implements ObjectPostProcess, UpdatablePostProcess {
    readonly cloudUniforms: CloudsUniforms;
    readonly object: Transformable;

    public static async CreateAsync(
        name: string,
        planet: Transformable & BoundingSphere,
        cloudsUniforms: CloudsUniforms,
        scene: UberScene,
        stellarObjects: Transformable[]
    ): Promise<FlatCloudsPostProcess> {
        const shaderName = "flatClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = flatCloudsFragment;
        }

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stellarObjects),
            ...getActiveCameraUniforms(scene),
            ...cloudsUniforms.getShaderUniforms()
        ];

        return cloudsUniforms.getShaderSamplers(scene).then((cloudSamplers) => {
            const samplers: ShaderSamplers = [
                ...getSamplers(scene),
                ...cloudSamplers,
            ];
            return new FlatCloudsPostProcess(name, shaderName, planet, cloudsUniforms, uniforms, samplers, scene);
        });
    }

    private constructor(
        name: string,
        shaderName: string,
        planet: Transformable,
        cloudUniforms: CloudsUniforms,
        uniforms: ShaderUniforms,
        samplers: ShaderSamplers,
        scene: UberScene
    ) {
        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.cloudUniforms = cloudUniforms;
    }

    public update(deltaTime: number): void {
        this.cloudUniforms.time += deltaTime;
    }
}
