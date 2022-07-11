import { Axis, Effect, Vector3 } from "@babylonjs/core";

import { SpacePostProcess } from "./spacePostProcess";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";
import { Star } from "../bodies/stars/star";

import starfieldFragment from "../../shaders/starfieldFragment.glsl";
import { StarSystemManager } from "../bodies/starSystemManager";

const shaderName = "starfield";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;

export interface StarfieldSettings {
    foo: number;
}

export class StarfieldPostProcess extends SpacePostProcess {
    settings: StarfieldSettings;

    star: Star | null = null;

    constructor(name: string, starSystem: StarSystemManager) {
        const settings: StarfieldSettings = {
            foo: 1
        };

        const uniforms: ShaderUniforms = [
            {
                name: "visibility",
                type: ShaderDataType.Float,
                get: () => {
                    //TODO: do something better
                    if (this.star == null) throw new Error("Your starfield doesn't have a star attached to it");
                    let vis = 1.0 - Vector3.Dot(this.star.getAbsolutePosition().normalizeToNew(), starSystem.scene.activeCamera!.getDirection(Axis.Z));
                    vis /= 2;
                    return vis;
                }
            }
        ];

        const samplers: ShaderSamplers = [];

        super(name, shaderName, uniforms, samplers, starSystem.scene);

        this.settings = settings;

        for (const pipeline of starSystem.pipelines) {
            pipeline.starfields.push(this);
        }
    }

    public setStar(star: Star) {
        this.star = star;
    }
}
