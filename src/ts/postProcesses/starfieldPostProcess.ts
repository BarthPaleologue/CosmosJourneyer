import { Axis, Effect, Scene, Vector3 } from "@babylonjs/core";

import { SpacePostProcess } from "./spacePostProcess";
import { ShaderDataType, ShaderSamplerData, ShaderUniformData, StarfieldSettings } from "./interfaces";
import { Star } from "../celestialBodies/stars/star";

import starfieldFragment from "../../shaders/starfield.fragment.fx";

const shaderName = "starfield";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;

export class StarfieldPostProcess extends SpacePostProcess {
    settings: StarfieldSettings;

    star: Star | null = null;

    constructor(name: string, scene: Scene) {
        let settings: StarfieldSettings = {};

        let uniforms: ShaderUniformData = {
            visibility: {
                type: ShaderDataType.Float,
                get: () => {
                    if (this.star == null) throw new Error("Your starfield doesn't have a star attached to it");
                    let vis = 1.0 - Vector3.Dot(this.star.getAbsolutePosition().normalizeToNew(), scene.activeCamera!.getDirection(Axis.Z));
                    vis /= 2;
                    return vis;
                }
            }
        };

        let samplers: ShaderSamplerData = {};

        super(name, shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }

    public setStar(star: Star) {
        this.star = star;
    }
}
