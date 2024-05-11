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

import shadowFragment from "../../shaders/shadowFragment.glsl";
import { ObjectPostProcess } from "./objectPostProcess";
import { Effect } from "@babylonjs/core/Materials/effect";
import { PostProcessType } from "./postProcessTypes";
import { RingsSamplerNames, RingsUniformNames, RingsUniforms } from "../rings/ringsUniform";
import { CelestialBody } from "../architecture/celestialBody";
import { StellarObject } from "../architecture/stellarObject";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "./uniforms/stellarObjectUniforms";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Constants } from "@babylonjs/core/Engines/constants";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { Scene } from "@babylonjs/core/scene";

export type ShadowUniforms = {
    hasRings: boolean;
    hasClouds: boolean;
    hasOcean: boolean;
};

export class ShadowPostProcess extends PostProcess implements ObjectPostProcess {
    readonly object: CelestialBody;
    readonly shadowUniforms: ShadowUniforms;
    readonly ringsUniforms: RingsUniforms | null;

    private activeCamera: Camera | null = null;

    constructor(
        name: string,
        body: CelestialBody,
        stellarObjects: StellarObject[],
        scene: Scene
    ) {
        const shaderName = "shadow";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = shadowFragment;
        }

        const shadowUniforms: ShadowUniforms = {
            hasRings: body.getRingsUniforms() !== null,
            hasClouds: body.postProcesses.includes(PostProcessType.CLOUDS),
            hasOcean: body.postProcesses.includes(PostProcessType.OCEAN)
        };

        const ShadowUniformNames = {
            STAR_RADIUSES: "star_radiuses",
            HAS_RINGS: "has_rings",
            HAS_CLOUDS: "has_clouds",
            HAS_OCEAN: "has_ocean"
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(RingsUniformNames),
            ...Object.values(ShadowUniformNames)
        ];

        const samplers: string[] = [
            ...Object.values(SamplerUniformNames),
            ...Object.values(RingsSamplerNames)
        ];

        super(name, shaderName, uniforms, samplers, 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, null, Constants.TEXTURETYPE_HALF_FLOAT);

        this.object = body;
        this.shadowUniforms = shadowUniforms;
        this.ringsUniforms = body.getRingsUniforms();

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                throw new Error("Camera is null");
            }

            setCameraUniforms(effect, this.activeCamera);
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, body);

            effect.setFloatArray(ShadowUniformNames.STAR_RADIUSES, stellarObjects.map((star) => star.getBoundingRadius()));
            effect.setBool(ShadowUniformNames.HAS_RINGS, shadowUniforms.hasRings);
            effect.setBool(ShadowUniformNames.HAS_CLOUDS, shadowUniforms.hasClouds);
            effect.setBool(ShadowUniformNames.HAS_OCEAN, shadowUniforms.hasOcean);

            if(this.ringsUniforms === null) {
                RingsUniforms.SetEmptyUniforms(effect);
                RingsUniforms.SetEmptySamplers(effect);
            } else {
                this.ringsUniforms.setUniforms(effect);
                this.ringsUniforms.setSamplers(effect);
            }
            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
