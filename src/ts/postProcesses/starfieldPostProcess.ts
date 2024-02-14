//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import starfieldFragment from "../../shaders/starfieldFragment.glsl";
import { TelluricPlanet } from "../planets/telluricPlanet/telluricPlanet";
import { UberScene } from "../uberCore/uberScene";
import { getActiveCameraUniforms, getSamplers, getStellarObjectsUniforms } from "./uniforms";
import { UberPostProcess } from "../uberCore/postProcesses/uberPostProcess";
import { Settings } from "../settings";
import { nearestBody } from "../utils/nearestBody";
import { Assets } from "../assets";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PostProcessType } from "./postProcessTypes";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { SamplerEnumType, ShaderSamplers, ShaderUniforms, UniformEnumType } from "../uberCore/postProcesses/types";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { Transformable } from "../architecture/transformable";
import { CelestialBody } from "../architecture/celestialBody";

export class StarfieldPostProcess extends UberPostProcess {
    constructor(scene: UberScene, stellarObjects: Transformable[], bodies: CelestialBody[], starfieldRotation: Quaternion) {
        const shaderName = "starfield";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;
        }

        const uniforms: ShaderUniforms = [
            ...getActiveCameraUniforms(scene),
            ...getStellarObjectsUniforms(stellarObjects),
            {
                name: "starfieldRotation",
                type: UniformEnumType.MATRIX,
                get: () => {
                    const rotationMatrix = new Matrix();
                    starfieldRotation.toRotationMatrix(rotationMatrix);
                    return rotationMatrix;
                }
            },
            {
                name: "visibility",
                type: UniformEnumType.FLOAT,
                get: () => {
                    if (bodies.length === 0) return 1;

                    const camera = scene.activeCamera;
                    if (camera === null) throw new Error("no camera");

                    //TODO: should be cleaned up
                    let vis = 1.0;
                    for (const star of stellarObjects) {
                        if (star instanceof BlackHole) return 1;
                        vis = Math.min(vis, 1.0 + Vector3.Dot(star.getTransform().getAbsolutePosition().normalizeToNew(), camera.getDirection(Axis.Z)));
                    }
                    vis = 0.5 + vis * 0.5;
                    let vis2 = 1.0;
                    const nearest = nearestBody(camera.globalPosition, bodies);
                    if (nearest instanceof TelluricPlanet) {
                        const planet = nearest as TelluricPlanet;
                        if (planet.postProcesses.includes(PostProcessType.ATMOSPHERE)) {
                            const height = planet.getTransform().getAbsolutePosition().length();
                            //FIXME: has to be dynamic
                            const maxHeight = Settings.ATMOSPHERE_HEIGHT;
                            for (const star of stellarObjects) {
                                const sunDir = planet.getTransform().getAbsolutePosition().subtract(star.getTransform().getAbsolutePosition()).normalize();
                                vis2 = Math.min(
                                    vis2,
                                    (height / maxHeight) ** 128 + Math.max(Vector3.Dot(sunDir, planet.getTransform().getAbsolutePosition().negate().normalize()), 0.0) ** 0.5
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
                type: SamplerEnumType.TEXTURE,
                get: () => {
                    return Assets.STAR_FIELD;
                }
            }
        ];

        super("starfield", shaderName, uniforms, samplers, scene);
    }
}
