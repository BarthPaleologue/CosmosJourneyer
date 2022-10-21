import { Effect, Vector3 } from "@babylonjs/core";

import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";

import starfieldFragment from "../../shaders/starfieldFragment.glsl";
import { BodyType } from "../bodies/interfaces";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { UberScene } from "../core/uberScene";
import { StarSystem } from "../bodies/starSystem";
import { getActiveCameraUniforms, getSamplers, getStarsUniforms } from "./uniforms";
import { UberPostProcess } from "./uberPostProcess";

const shaderName = "starfield";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;

export interface StarfieldSettings {
    foo: number;
}

export class StarfieldPostProcess extends UberPostProcess {
    settings: StarfieldSettings;

    constructor(name: string, scene: UberScene, starSystem: StarSystem) {
        const settings: StarfieldSettings = {
            foo: 1
        };

        const uniforms: ShaderUniforms = [
            ...getActiveCameraUniforms(scene),
            ...getStarsUniforms(starSystem),
            {
                name: "visibility",
                type: ShaderDataType.Float,
                get: () => {
                    //TODO: should be cleaned up
                    let vis = 1.0;
                    for (const star of starSystem.stars) {
                        vis = Math.min(vis, 1.0 - Vector3.Dot(star.getAbsolutePosition().normalizeToNew(), scene.getActiveController().transform.getForwardDirection()));
                    }
                    vis /= 2;
                    let vis2 = 1.0;
                    if (scene.getActiveController().getNearestBody() != null && scene.getActiveController().getNearestBody().bodyType == BodyType.TELLURIC) {
                        const planet = scene.getActiveController().getNearestBody() as TelluricPlanet;
                        if (planet.postProcesses.atmosphere != null) {
                            const height = planet.getAbsolutePosition().length();
                            const maxHeight = planet.postProcesses.atmosphere.settings.atmosphereRadius;
                            for (const star of starSystem.stars) {
                                const sunDir = planet.getAbsolutePosition().subtract(star.getAbsolutePosition()).normalize();
                                vis2 = Math.min(vis2, (height / maxHeight) ** 32 + Math.max(Vector3.Dot(sunDir, planet.getAbsolutePosition().negate().normalize()), 0.0) ** 0.5);
                            }
                        }
                    }
                    vis = Math.min(vis, vis2);
                    return vis;
                }
            },
            {
                name: "time",
                type: ShaderDataType.Float,
                get: () => {
                    return starSystem.getTime() % 100000;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.settings = settings;
        scene.uberRenderingPipeline.starFields.push(this);

    }
}
