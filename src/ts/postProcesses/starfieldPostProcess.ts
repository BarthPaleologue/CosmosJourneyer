import { Effect, Vector3 } from "@babylonjs/core";

import { SpacePostProcess } from "./spacePostProcess";
import { ShaderDataType, ShaderSamplers, ShaderUniforms } from "./interfaces";

import starfieldFragment from "../../shaders/starfieldFragment.glsl";
import { AbstractController } from "../controllers/abstractController";
import { BodyType } from "../bodies/interfaces";
import { TelluricPlanet } from "../bodies/planets/telluricPlanet";
import { UberScene } from "../core/uberScene";
import { StarSystem } from "../bodies/starSystem";

const shaderName = "starfield";
Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;

export interface StarfieldSettings {
    foo: number;
}

export class StarfieldPostProcess extends SpacePostProcess {
    settings: StarfieldSettings;

    constructor(name: string, player: AbstractController, scene: UberScene, starSystem: StarSystem) {
        const settings: StarfieldSettings = {
            foo: 1
        };

        const uniforms: ShaderUniforms = [
            {
                name: "visibility",
                type: ShaderDataType.Float,
                get: () => {
                    //TODO: should be cleaned up
                    let vis = 1.0;
                    for (const star of starSystem.stars) {
                        vis = Math.min(vis, 1.0 - Vector3.Dot(star.getAbsolutePosition().normalizeToNew(), player.transform.getForwardDirection()));
                    }
                    vis /= 2;
                    let vis2 = 1.0;
                    if (player.nearestBody != null && player.nearestBody.bodyType == BodyType.TELLURIC) {
                        const planet = player.nearestBody as TelluricPlanet;
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

        const samplers: ShaderSamplers = [];

        super(name, shaderName, uniforms, samplers, scene, starSystem);

        this.settings = settings;

        for (const pipeline of scene.pipelines) {
            pipeline.starFields.push(this);
        }
    }
}
