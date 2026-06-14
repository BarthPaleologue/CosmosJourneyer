//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Constants } from "@babylonjs/core/Engines/constants";
import type { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import type { DepthRendererManager } from "../helpers/depthRendererManager";
import type { HasBoundingSphere } from "../universe/architecture/hasBoundingSphere";
import type { Transformable } from "../universe/architecture/transformable";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { setSphereShadowCasterUniforms, SphereShadowCasterUniformNames } from "./uniforms/sphereShadowCasterUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "./uniforms/stellarObjectUniforms";

import sphereShadowsFragment from "@shaders/sphereShadows.glsl";

export class SphereShadowsPostProcess extends PostProcess {
    private activeCamera: Camera | null = null;

    private readonly sphereShadowCasters: Array<Transformable & HasBoundingSphere> = [];
    private readonly stellarLights: Array<DirectionalLight> = [];

    constructor(depthRendererManager: DepthRendererManager, scene: Scene) {
        const shaderName = "sphereShadows";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = sphereShadowsFragment;
        }

        const uniforms: string[] = [
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(SphereShadowCasterUniformNames),
        ];

        const samplers: string[] = [...Object.values(SamplerUniformNames)];

        super(
            "SphereShadowsPostProcess",
            shaderName,
            uniforms,
            samplers,
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            null,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                console.warn("Camera is null");
                return;
            }

            const floatingOriginOffset = scene.floatingOriginOffset;
            const floatingOriginEnabled = scene.floatingOriginMode;

            setCameraUniforms(effect, this.activeCamera, floatingOriginEnabled);
            setStellarObjectUniforms(effect, this.stellarLights);
            setSphereShadowCasterUniforms(effect, this.sphereShadowCasters, floatingOriginOffset);

            setSamplerUniforms(effect, this.activeCamera, depthRendererManager);
        });
    }

    public addShadowCaster(shadowCaster: Transformable & HasBoundingSphere) {
        this.sphereShadowCasters.push(shadowCaster);
    }

    public addStellarLights(light: ReadonlyArray<DirectionalLight>) {
        this.stellarLights.push(...light);
    }

    public reset() {
        this.sphereShadowCasters.length = 0;
        this.stellarLights.length = 0;
    }
}
