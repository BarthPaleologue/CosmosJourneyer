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
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import { createEmptyTexture } from "@/frontend/assets/procedural/proceduralTexture";
import { type CloudsUniforms } from "@/frontend/postProcesses/clouds/cloudsUniforms";
import { RingsSamplerNames, RingsUniformNames, RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";
import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { type LightEmitter } from "@/frontend/universe/architecture/lightEmitter";

import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";
import { setStellarObjectUniforms, StellarObjectUniformNames } from "./uniforms/stellarObjectUniforms";

import shadowFragment from "@shaders/shadowFragment.glsl";

export type ShadowUniforms = {
    hasRings: boolean;
    hasClouds: boolean;
    hasOcean: boolean;
};

export class ShadowPostProcess extends PostProcess {
    readonly shadowUniforms: ShadowUniforms;
    readonly ringsUniforms: RingsUniforms | null;

    private activeCamera: Camera | null = null;

    private readonly emptyTexture: Texture;

    constructor(
        transform: TransformNode,
        boundingRadius: number,
        ringsUniforms: RingsUniforms | null,
        cloudsUniforms: CloudsUniforms | null,
        hasOcean: boolean,
        stellarObjects: ReadonlyArray<HasBoundingSphere & LightEmitter>,
        scene: Scene,
    ) {
        const shaderName = "shadow";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = shadowFragment;
        }

        const shadowUniforms: ShadowUniforms = {
            hasRings: ringsUniforms !== null,
            hasClouds: cloudsUniforms !== null,
            hasOcean: hasOcean,
        };

        const ShadowUniformNames = {
            STAR_RADIUSES: "star_radiuses",
            HAS_RINGS: "shadowUniforms_hasRings",
            HAS_CLOUDS: "shadowUniforms_hasClouds",
            HAS_OCEAN: "shadowUniforms_hasOcean",
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(RingsUniformNames),
            ...Object.values(ShadowUniformNames),
        ];

        const samplers: string[] = [...Object.values(SamplerUniformNames), ...Object.values(RingsSamplerNames)];

        super(
            `${transform.name}ShadowPostProcess`,
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

        this.shadowUniforms = shadowUniforms;
        this.ringsUniforms = ringsUniforms;

        this.emptyTexture = createEmptyTexture(scene);

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
            setStellarObjectUniforms(
                effect,
                stellarObjects.map((star) => star.getLight()),
                floatingOriginOffset,
            );
            setObjectUniforms(effect, transform, boundingRadius, floatingOriginOffset);

            effect.setFloatArray(
                ShadowUniformNames.STAR_RADIUSES,
                stellarObjects.map((star) => star.getBoundingRadius()),
            );
            effect.setBool(ShadowUniformNames.HAS_RINGS, shadowUniforms.hasRings);
            effect.setBool(ShadowUniformNames.HAS_CLOUDS, shadowUniforms.hasClouds);
            effect.setBool(ShadowUniformNames.HAS_OCEAN, shadowUniforms.hasOcean);

            if (this.ringsUniforms === null) {
                RingsUniforms.SetEmptyUniforms(effect);
                RingsUniforms.SetEmptySamplers(effect, this.emptyTexture);
            } else {
                this.ringsUniforms.setUniforms(effect);
                this.ringsUniforms.setSamplers(effect);
            }
            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }

    override dispose(camera?: Camera): void {
        super.dispose(camera);
        this.emptyTexture.dispose();
    }
}
