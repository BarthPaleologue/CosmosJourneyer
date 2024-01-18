import volumetricCloudsFragment from "../../shaders/volumetricCloudsFragment.glsl";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getObjectUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { ObjectPostProcess } from "./objectPostProcess";
import { FlatCloudsPostProcess } from "./clouds/flatCloudsPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { UniformEnumType, ShaderSamplers, ShaderUniforms } from "../uberCore/postProcesses/types";
import { StellarObject } from "../stellarObjects/stellarObject";
import { CloudsUniforms } from "./clouds/cloudsUniforms";
import { Transformable } from "../uberCore/transforms/basicTransform";
import { BoundingSphere } from "../bodies/cullable";

export type CloudsPostProcess = FlatCloudsPostProcess | VolumetricCloudsPostProcess;

export class VolumetricCloudsPostProcess extends UberPostProcess implements ObjectPostProcess {
    readonly cloudUniforms: CloudsUniforms;
    readonly object: Transformable;

    constructor(name: string, planet: Transformable & BoundingSphere, cloudsUniforms: CloudsUniforms, scene: UberScene, stars: StellarObject[]) {
        const shaderName = "volumetricClouds";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = volumetricCloudsFragment;
        }

        const uniforms: ShaderUniforms = [
            ...getObjectUniforms(planet),
            ...getStellarObjectsUniforms(stars),
            ...getActiveCameraUniforms(scene),
            {
                name: "cloudLayerMinHeight",
                type: UniformEnumType.Float,
                get: () => {
                    return planet.getBoundingRadius();
                }
            },
            {
                name: "cloudLayerMaxHeight",
                type: UniformEnumType.Float,
                get: () => {
                    return planet.getBoundingRadius() + 30e3;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.object = planet;
        this.cloudUniforms = cloudsUniforms;
    }
}
