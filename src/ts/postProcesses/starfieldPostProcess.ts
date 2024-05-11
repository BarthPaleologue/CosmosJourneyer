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
import { Settings } from "../settings";
import { nearestBody } from "../utils/nearestBody";
import { Assets } from "../assets";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PostProcessType } from "./postProcessTypes";
import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Matrix, Quaternion } from "@babylonjs/core/Maths/math";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { Transformable } from "../architecture/transformable";
import { CelestialBody } from "../architecture/celestialBody";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "./uniforms/stellarObjectUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { Scene } from "@babylonjs/core/scene";

export class StarfieldPostProcess extends PostProcess {
    private activeCamera: Camera | null = null;

    constructor(scene: Scene, stellarObjects: Transformable[], bodies: CelestialBody[], starfieldRotation: Quaternion) {
        const shaderName = "starfield";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = starfieldFragment;
        }

        const StarfieldUniformNames = {
            STARFIELD_ROTATION: "starfieldRotation",
            VISIBILITY: "visibility"
        }

        const StarfieldSamplerNames = {
            STARFIELD_TEXTURE: "starfieldTexture"
        }

        const uniforms: string[] = [
            ...Object.values(CameraUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(StarfieldUniformNames)
        ];

        const samplers: string[] = [
            ...Object.values(SamplerUniformNames),
            ...Object.values(StarfieldSamplerNames),
        ];

        super("starfield", shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            
            if(this.activeCamera === null) {
                throw new Error("Camera is null");
            }
            
            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);

            const starfieldRotationMatrix = new Matrix();
            starfieldRotation.toRotationMatrix(starfieldRotationMatrix);
            effect.setMatrix(StarfieldUniformNames.STARFIELD_ROTATION, starfieldRotationMatrix);

            if (stellarObjects.length === 0) effect.setFloat(StarfieldUniformNames.VISIBILITY, 1);
            else {
                //TODO: should be cleaned up
                let vis = 1.0;
                for (const star of stellarObjects) {
                    if (star instanceof BlackHole) continue;
                    vis = Math.min(vis, 1.0 + Vector3.Dot(star.getTransform().getAbsolutePosition().normalizeToNew(), this.activeCamera.getDirection(Axis.Z)));
                }
                vis = 0.5 + vis * 0.5;
                let vis2 = 1.0;
                const nearest = nearestBody(this.activeCamera.globalPosition, bodies);
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

                effect.setFloat(StarfieldUniformNames.VISIBILITY, vis);
            }

            setSamplerUniforms(effect, this.activeCamera, scene);
            effect.setTexture(StarfieldSamplerNames.STARFIELD_TEXTURE, Assets.STAR_FIELD);
        });
    }
}
