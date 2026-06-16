//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";
import { assertUnreachable, type DeepReadonly } from "@cosmos-journeyer/typescript";
import { type AnomalyModel, type DarkKnightModel } from "@cosmos-journeyer/universe-model";

import type { DepthRendererManager } from "@/frontend/helpers/depthRendererManager";
import { type AtmosphereUniforms } from "@/frontend/postProcesses/atmosphere/atmosphereUniforms";
import {
    CloudsSamplerNames,
    CloudsUniformNames,
    type CloudsUniforms,
} from "@/frontend/postProcesses/clouds/cloudsUniforms";
import { type OceanUniforms } from "@/frontend/postProcesses/ocean/oceanUniforms";
import { RingsSamplerNames, RingsUniformNames, type RingsUniforms } from "@/frontend/postProcesses/rings/ringsUniform";
import { CameraUniformNames, setCameraUniforms } from "@/frontend/postProcesses/uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "@/frontend/postProcesses/uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "@/frontend/postProcesses/uniforms/samplerUniforms";
import {
    setSphereShadowCasterUniforms,
    SphereShadowCasterUniformNames,
    type SphereShadowCaster,
} from "@/frontend/postProcesses/uniforms/sphereShadowCasterUniforms";
import {
    setStellarObjectUniforms,
    StellarObjectUniformNames,
} from "@/frontend/postProcesses/uniforms/stellarObjectUniforms";
import { type UpdatablePostProcess } from "@/frontend/postProcesses/updatablePostProcess";

import celestialBodyUberShaderFragment from "@shaders/celestialBodyUberShaderFragment.glsl";

const CelestialBodyUberShaderUniformNames = {
    BODY_EMITS_LIGHT: "bodyEmitsLight",
    ELAPSED_SECONDS: "elapsedSeconds",
} as const;

const CelestialBodyUberShaderRaymarchedBodyUniformNames = {
    ACCENT_COLOR: "accent_color",
    AVERAGE_SCREEN_SIZE: "average_screen_size",
    MANDELBULB_POWER: "mandelbulb_power",
    MANDELBOX_MR2: "mandelbox_mr2",
    MANDELBOX_SPREAD: "mandelbox_spread",
} as const;

type RaymarchedBodyModel = Exclude<AnomalyModel, DarkKnightModel>;

export type CelestialBodyUberShaderFeatures = {
    readonly raymarchedBody: DeepReadonly<RaymarchedBodyModel> | null;
    readonly atmosphere: AtmosphereUniforms | null;
    readonly clouds: CloudsUniforms | null;
    readonly ocean: OceanUniforms | null;
    readonly rings: RingsUniforms | null;
};

export class CelestialBodyUberShaderPass extends PostProcess implements UpdatablePostProcess {
    private activeCamera: Camera | null = null;

    private elapsedSeconds = 0;

    readonly features: CelestialBodyUberShaderFeatures;

    public get ringsUniforms(): RingsUniforms | null {
        return this.features.rings;
    }

    constructor(
        bodyTransform: TransformNode,
        bodyBoundingRadius: number,
        bodyEmitsLight: boolean,
        features: CelestialBodyUberShaderFeatures,
        stellarObjects: ReadonlyArray<DirectionalLight>,
        shadowCasters: ReadonlyArray<SphereShadowCaster>,
        depthRendererManager: DepthRendererManager,
        scene: Scene,
    ) {
        const shaderName = "celestialBodyUberShader";
        Effect.ShadersStore[`${shaderName}FragmentShader`] ??= celestialBodyUberShaderFragment;

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            CelestialBodyUberShaderUniformNames.ELAPSED_SECONDS,
        ];
        const samplers: string[] = [...Object.values(SamplerUniformNames)];
        const defines: string[] = [];

        if (features.raymarchedBody !== null) {
            uniforms.push(...Object.values(CelestialBodyUberShaderRaymarchedBodyUniformNames));
            defines.push(
                "#define HAS_RAYMARCHED_BODY",
                `#define ${CelestialBodyUberShaderPass.GetRaymarchedBodyDefine(features.raymarchedBody)}`,
            );
        }

        if (features.atmosphere !== null) {
            uniforms.push(...features.atmosphere.getUniformNames());
            defines.push("#define HAS_ATMOSPHERE");
        }

        if (features.clouds !== null) {
            uniforms.push(...Object.values(CloudsUniformNames));
            samplers.push(...Object.values(CloudsSamplerNames));
            defines.push("#define HAS_CLOUDS");
        }

        if (features.ocean !== null) {
            uniforms.push(...features.ocean.getUniformNames());
            samplers.push(...features.ocean.getSamplerNames());
            defines.push("#define HAS_OCEAN");
        }

        if (features.rings !== null) {
            uniforms.push(
                ...Object.values(RingsUniformNames),
                ...Object.values(SphereShadowCasterUniformNames),
                ...Object.values(CelestialBodyUberShaderUniformNames),
            );
            samplers.push(...Object.values(RingsSamplerNames));
            defines.push("#define HAS_RINGS");
        }

        super(
            `${bodyTransform.name}CelestialBodyUberShaderPass`,
            shaderName,
            uniforms,
            samplers,
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            scene.getEngine(),
            false,
            defines.join("\n"),
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        this.features = features;

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
            setStellarObjectUniforms(effect, stellarObjects);
            setObjectUniforms(effect, bodyTransform, bodyBoundingRadius, floatingOriginOffset);
            effect.setFloat(CelestialBodyUberShaderUniformNames.ELAPSED_SECONDS, this.elapsedSeconds);

            features.atmosphere?.setUniforms(effect);

            if (features.raymarchedBody !== null) {
                CelestialBodyUberShaderPass.SetRaymarchedBodyUniforms(
                    effect,
                    features.raymarchedBody,
                    (scene.getEngine().getRenderWidth() + scene.getEngine().getRenderHeight()) / 2,
                );
            }

            if (features.ocean !== null) {
                features.ocean.setUniforms(effect, bodyTransform);
                features.ocean.setSamplers(effect);
            }

            if (features.clouds !== null) {
                features.clouds.setUniforms(effect);
                features.clouds.setSamplers(effect);
            }

            if (features.rings !== null) {
                features.rings.setUniforms(effect);
                features.rings.setSamplers(effect);
                setSphereShadowCasterUniforms(effect, shadowCasters, floatingOriginOffset);
                effect.setBool(CelestialBodyUberShaderUniformNames.BODY_EMITS_LIGHT, bodyEmitsLight);
            }

            setSamplerUniforms(effect, this.activeCamera, depthRendererManager);
        });
    }

    public update(deltaSeconds: number): void {
        this.elapsedSeconds += deltaSeconds;
        this.elapsedSeconds %= 24 * 60 * 60;
    }

    private static GetRaymarchedBodyDefine(raymarchedBody: DeepReadonly<RaymarchedBodyModel>): string {
        switch (raymarchedBody.type) {
            case "mandelbulb":
                return "HAS_MANDELBULB";
            case "juliaSet":
                return "HAS_JULIA_SET";
            case "mandelbox":
                return "HAS_MANDELBOX";
            case "sierpinskiPyramid":
                return "HAS_SIERPINSKI_PYRAMID";
            case "mengerSponge":
                return "HAS_MENGER_SPONGE";
            default:
                return assertUnreachable(raymarchedBody);
        }
    }

    private static SetRaymarchedBodyUniforms(
        effect: Effect,
        raymarchedBody: DeepReadonly<RaymarchedBodyModel>,
        averageScreenSize: number,
    ): void {
        effect.setFloat(CelestialBodyUberShaderRaymarchedBodyUniformNames.AVERAGE_SCREEN_SIZE, averageScreenSize);

        switch (raymarchedBody.type) {
            case "mandelbulb":
                effect.setColor3(
                    CelestialBodyUberShaderRaymarchedBodyUniformNames.ACCENT_COLOR,
                    raymarchedBody.accentColor,
                );
                effect.setFloat(
                    CelestialBodyUberShaderRaymarchedBodyUniformNames.MANDELBULB_POWER,
                    raymarchedBody.power,
                );
                break;
            case "juliaSet":
                effect.setColor3(
                    CelestialBodyUberShaderRaymarchedBodyUniformNames.ACCENT_COLOR,
                    raymarchedBody.accentColor,
                );
                break;
            case "mandelbox":
                effect.setColor3(CelestialBodyUberShaderRaymarchedBodyUniformNames.ACCENT_COLOR, raymarchedBody.color);
                effect.setFloat(CelestialBodyUberShaderRaymarchedBodyUniformNames.MANDELBOX_MR2, raymarchedBody.mr2);
                effect.setFloat(
                    CelestialBodyUberShaderRaymarchedBodyUniformNames.MANDELBOX_SPREAD,
                    raymarchedBody.spread,
                );
                break;
            case "sierpinskiPyramid":
                effect.setColor3(
                    CelestialBodyUberShaderRaymarchedBodyUniformNames.ACCENT_COLOR,
                    raymarchedBody.accentColor,
                );
                break;
            case "mengerSponge":
                effect.setColor3(CelestialBodyUberShaderRaymarchedBodyUniformNames.ACCENT_COLOR, raymarchedBody.color);
                break;
            default:
                return assertUnreachable(raymarchedBody);
        }
    }
}
