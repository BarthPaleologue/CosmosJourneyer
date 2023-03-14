import { Effect, Vector3 } from "@babylonjs/core";

import starfieldFragment from "../../shaders/starfieldFragment.glsl";
import { TelluricPlanemo } from "../bodies/planemos/telluricPlanemo";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getSamplers, getStarsUniforms } from "./uniforms";
import { ShaderDataType, ShaderSamplers, ShaderUniforms, UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { Settings } from "../settings";
import { BlackHole } from "../bodies/stellarObjects/blackHole";
import { Star } from "../bodies/stellarObjects/star";
import { nearestBody } from "../utils/nearestBody";
import { AbstractBody } from "../bodies/abstractBody";
import { Assets } from "../assets";

const shaderName = "starfield";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;

export interface StarfieldSettings {
    foo: number;
}

export class StarfieldPostProcess extends UberPostProcess {
    settings: StarfieldSettings;

    constructor(scene: UberScene, stars: (Star | BlackHole)[], bodies: AbstractBody[]) {
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
                        if (star instanceof BlackHole) return 1;
                        vis = Math.min(vis, 1.0 - Vector3.Dot(star.transform.getAbsolutePosition().normalizeToNew(), scene.getActiveController().transform.getForwardDirection()));
                    }
                    let vis2 = 1.0;
                    const nearest = nearestBody(scene.getActiveController().transform, bodies);
                    if (nearest instanceof TelluricPlanemo) {
                        const planet = nearest as TelluricPlanemo;
                        if (planet.postProcesses.atmosphere) {
                            const height = planet.transform.getAbsolutePosition().length();
                            //FIXME: has to be dynamic
                            const maxHeight = Settings.ATMOSPHERE_HEIGHT;
                            for (const star of stars) {
                                const sunDir = planet.transform.getAbsolutePosition().subtract(star.transform.getAbsolutePosition()).normalize();
                                vis2 = Math.min(
                                    vis2,
                                    (height / maxHeight) ** 128 + Math.max(Vector3.Dot(sunDir, planet.transform.getAbsolutePosition().negate().normalize()), 0.0) ** 0.5
                                );
                            }
                        }
                    }
                    vis = Math.min(vis, vis2);
                    return vis;
                }
            }
        ];

        const samplers: ShaderSamplers = [
            ...getSamplers(scene),
            {
                name: "starfieldTexture",
                type: ShaderDataType.Texture,
                get: () => {
                    return Assets.Starfield;
                }
            }
        ];

        super("starfield", shaderName, uniforms, samplers, scene);

        this.settings = settings;
    }
}
