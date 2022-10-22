import { Effect, Vector3 } from "@babylonjs/core";

import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";

import starfieldFragment from "../../shaders/starfieldFragment.glsl";
import { BodyType } from "../bodies/interfaces";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { UberScene } from "../core/uberScene";
import { getActiveCameraUniforms, getSamplers, getStarsUniforms } from "./uniforms";
import { UberPostProcess } from "./uberPostProcess";
import { Settings } from "../settings";
import { BlackHole } from "../bodies/blackHole";
import { Star } from "../bodies/stars/star";
import { nearestBody } from "../utils/nearestBody";
import { AbstractBody } from "../bodies/abstractBody";

const shaderName = "starfield";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;

export interface StarfieldSettings {
    foo: number;
}

export class StarfieldPostProcess extends UberPostProcess {
    settings: StarfieldSettings;

    constructor(name: string, scene: UberScene, stars: (Star | BlackHole)[], bodies: AbstractBody[]) {
        const settings: StarfieldSettings = {
            foo: 1
        };

        const uniforms: ShaderUniforms = [
            ...getActiveCameraUniforms(scene),
            ...getStarsUniforms(stars),
            {
                name: "visibility",
                type: ShaderDataType.Float,
                get: () => {
                    //TODO: should be cleaned up
                    let vis = 1.0;
                    for (const star of stars) {
                        vis = Math.min(vis, 1.0 - Vector3.Dot(star.getAbsolutePosition().normalizeToNew(), scene.getActiveController().transform.getForwardDirection()));
                    }
                    vis /= 2;
                    let vis2 = 1.0;
                    const nearest = nearestBody(scene.getActiveController().transform, bodies);
                    if (nearest.bodyType == BodyType.TELLURIC) {
                        const planet = nearest as TelluricPlanet;
                        if (planet.postProcesses.atmosphere != null) {
                            const height = planet.getAbsolutePosition().length();
                            //FIXME: has to be dynamic
                            const maxHeight = Settings.ATMOSPHERE_HEIGHT;
                            for (const star of stars) {
                                const sunDir = planet.getAbsolutePosition().subtract(star.getAbsolutePosition()).normalize();
                                vis2 = Math.min(vis2, (height / maxHeight) ** 32 + Math.max(Vector3.Dot(sunDir, planet.getAbsolutePosition().negate().normalize()), 0.0) ** 0.5);
                            }
                        }
                    }
                    vis = Math.min(vis, vis2);
                    return vis;
                }
            }
        ];

        const samplers: ShaderSamplers = getSamplers(scene);

        super(name, shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
