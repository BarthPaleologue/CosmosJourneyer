import { Effect } from "@babylonjs/core";

import { ShaderSamplers, ShaderUniforms } from "../interfaces";
import { PlanetPostProcess } from "../planetPostProcess";

import blackHoleFragment from "../../../shaders/blackhole.glsl";
import { Planet } from "../../bodies/planets/planet";
import { UberScene } from "../../core/uberScene";
import { AbstractBody } from "../../bodies/abstractBody";

const shaderName = "blackhole";
Effect.ShadersStore[`${shaderName}FragmentShader`] = blackHoleFragment;

export interface BlackHoleSettings {}

export class BlackHolePostProcess extends PlanetPostProcess {
    settings: BlackHoleSettings;

    constructor(name: string, planet: AbstractBody, scene: UberScene) {
        const settings: BlackHoleSettings = {};

        const uniforms: ShaderUniforms = [];

        const samplers: ShaderSamplers = [];

        super(name, shaderName, uniforms, samplers, planet, scene);

        this.settings = settings;

        for (const pipeline of scene.pipelines) {
            pipeline.blackHoles.push(this);
        }
    }
}
