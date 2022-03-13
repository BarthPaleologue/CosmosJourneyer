import {Axis, Scene, Vector3} from "@babylonjs/core";

import {SpacePostProcess} from "./spacePostProcess";
import {ShaderDataType, ShaderSamplerData, ShaderUniformData, StarfieldSettings} from "./interfaces";
import {CelestialBody} from "../celestialBodies/celestialBody";

export class StarfieldPostProcess extends SpacePostProcess {

    settings: StarfieldSettings;

    constructor(name: string, sun: CelestialBody, scene: Scene) {

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

        super(name, "./shaders/starfield", uniforms, samplers, scene);

        this.settings = settings;
    }
}