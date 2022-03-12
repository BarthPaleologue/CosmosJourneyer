import {Axis, Light, Mesh, Scene, Vector3} from "@babylonjs/core";

import {ExtendedPostProcess} from "./extendedPostProcess";
import {ShaderDataType, ShaderSamplerData, ShaderUniformData, StarfieldSettings} from "./interfaces";

export class StarfieldPostProcess extends ExtendedPostProcess {

    settings: StarfieldSettings;

    constructor(name: string, sun: Mesh | Light, scene: Scene) {

        let settings = {};

        let uniforms: ShaderUniformData = {
            "sunPosition": {
                type: ShaderDataType.Vector3,
                get: () => {return sun.getAbsolutePosition()}
            },

            "visibility": {
                type: ShaderDataType.Float,
                get: () => {
                    let vis = 1.0 - Vector3.Dot(sun.getAbsolutePosition().normalizeToNew(), scene.activeCamera!.getDirection(Axis.Z));
                    vis /= 2;
                    return vis;
                }
            }
        };

        let samplers: ShaderSamplerData = {}

        super(name, "./shaders/starfield", uniforms, samplers, scene.activeCamera!, scene);

        this.settings = settings;
    }
}