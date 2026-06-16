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
import { Matrix } from "@babylonjs/core/Maths/math.vector";
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

import { type MatterJetsSettings } from "./matterJetsSettings";

import celestialBodyUberShaderFragment from "@shaders/celestialBodyUberShaderFragment.glsl";

const UberShaderUniformNames = {
    BODY_EMITS_LIGHT: "bodyEmitsLight",
    ELAPSED_SECONDS: "elapsedSeconds",
} as const;

const RaymarchedBodyUniformNames = {
    ACCENT_COLOR: "accent_color",
    AVERAGE_SCREEN_SIZE: "average_screen_size",
    MANDELBULB_POWER: "mandelbulb_power",
    MANDELBOX_MR2: "mandelbox_mr2",
    MANDELBOX_SPREAD: "mandelbox_spread",
} as const;

const MatterJetsUniformNames = {
    INVERSE_ROTATION: "inverse_rotation",
    DIPOLE_TILT: "dipole_tilt",
} as const;

type RaymarchedBodyModel = Exclude<AnomalyModel, DarkKnightModel>;

export type CelestialBodyUberShaderFeatures = {
    readonly raymarchedBody: DeepReadonly<RaymarchedBodyModel> | null;
    readonly matterJets: MatterJetsSettings | null;
    readonly atmosphere: AtmosphereUniforms | null;
    readonly clouds: CloudsUniforms | null;
    readonly ocean: OceanUniforms | null;
    readonly rings: RingsUniforms | null;
};

export type CelestialBodyUberShaderBody = {
    readonly transform: TransformNode;
    readonly boundingRadius: number;
    readonly emitsLight: boolean;
};

export type CelestialBodyUberShaderLighting = {
    readonly stellarObjects: ReadonlyArray<DirectionalLight>;
    readonly shadowCasters: ReadonlyArray<SphereShadowCaster>;
};

export class CelestialBodyUberShaderPass extends PostProcess implements UpdatablePostProcess {
    private activeCamera: Camera | null = null;

    private elapsedSeconds = 0;

    private readonly matterJetsInverseRotation = Matrix.Identity();

    readonly features: CelestialBodyUberShaderFeatures;

    public get ringsUniforms(): RingsUniforms | null {
        return this.features.rings;
    }

    constructor(
        body: CelestialBodyUberShaderBody,
        features: Partial<CelestialBodyUberShaderFeatures>,
        lighting: CelestialBodyUberShaderLighting,
        depthRendererManager: DepthRendererManager,
        scene: Scene,
    ) {
        const bodyTransform = body.transform;
        const enabledFeatures: CelestialBodyUberShaderFeatures = {
            raymarchedBody: features.raymarchedBody ?? null,
            matterJets: features.matterJets ?? null,
            atmosphere: features.atmosphere ?? null,
            clouds: features.clouds ?? null,
            ocean: features.ocean ?? null,
            rings: features.rings ?? null,
        };

        const shaderName = "celestialBodyUberShader";
        Effect.ShadersStore[`${shaderName}FragmentShader`] ??= celestialBodyUberShaderFragment;

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(StellarObjectUniformNames),
            ...Object.values(CameraUniformNames),
            UberShaderUniformNames.ELAPSED_SECONDS,
        ];
        const samplers: string[] = [...Object.values(SamplerUniformNames)];
        const defines: string[] = [];

        if (enabledFeatures.raymarchedBody !== null) {
            uniforms.push(...Object.values(RaymarchedBodyUniformNames));
            defines.push(
                "#define HAS_RAYMARCHED_BODY",
                `#define ${getRaymarchedBodyDefine(enabledFeatures.raymarchedBody)}`,
            );
        }

        if (enabledFeatures.matterJets !== null) {
            uniforms.push(...Object.values(MatterJetsUniformNames));
            defines.push("#define HAS_MATTER_JETS");
        }

        if (enabledFeatures.atmosphere !== null) {
            uniforms.push(...enabledFeatures.atmosphere.getUniformNames());
            defines.push("#define HAS_ATMOSPHERE");
        }

        if (enabledFeatures.clouds !== null) {
            uniforms.push(...Object.values(CloudsUniformNames));
            samplers.push(...Object.values(CloudsSamplerNames));
            defines.push("#define HAS_CLOUDS");
        }

        if (enabledFeatures.ocean !== null) {
            uniforms.push(...enabledFeatures.ocean.getUniformNames());
            samplers.push(...enabledFeatures.ocean.getSamplerNames());
            defines.push("#define HAS_OCEAN");
        }

        if (enabledFeatures.rings !== null) {
            uniforms.push(
                ...Object.values(RingsUniformNames),
                ...Object.values(SphereShadowCasterUniformNames),
                UberShaderUniformNames.BODY_EMITS_LIGHT,
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

        this.features = enabledFeatures;

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
            setStellarObjectUniforms(effect, lighting.stellarObjects);
            setObjectUniforms(effect, bodyTransform, body.boundingRadius, floatingOriginOffset);
            effect.setFloat(UberShaderUniformNames.ELAPSED_SECONDS, this.elapsedSeconds);

            enabledFeatures.atmosphere?.setUniforms(effect);

            if (enabledFeatures.raymarchedBody !== null) {
                setRaymarchedBodyUniforms(
                    effect,
                    enabledFeatures.raymarchedBody,
                    (scene.getEngine().getRenderWidth() + scene.getEngine().getRenderHeight()) / 2,
                );
            }

            if (enabledFeatures.matterJets !== null) {
                bodyTransform.getWorldMatrix().getRotationMatrixToRef(this.matterJetsInverseRotation);
                this.matterJetsInverseRotation.transposeToRef(this.matterJetsInverseRotation);

                effect.setMatrix(MatterJetsUniformNames.INVERSE_ROTATION, this.matterJetsInverseRotation);
                effect.setFloat(MatterJetsUniformNames.DIPOLE_TILT, enabledFeatures.matterJets.dipoleTilt);
            }

            if (enabledFeatures.ocean !== null) {
                enabledFeatures.ocean.setUniforms(effect, bodyTransform);
                enabledFeatures.ocean.setSamplers(effect);
            }

            if (enabledFeatures.clouds !== null) {
                enabledFeatures.clouds.setUniforms(effect);
                enabledFeatures.clouds.setSamplers(effect);
            }

            if (enabledFeatures.rings !== null) {
                enabledFeatures.rings.setUniforms(effect);
                enabledFeatures.rings.setSamplers(effect);
                setSphereShadowCasterUniforms(effect, lighting.shadowCasters, floatingOriginOffset);
                effect.setBool(UberShaderUniformNames.BODY_EMITS_LIGHT, body.emitsLight);
            }

            setSamplerUniforms(effect, this.activeCamera, depthRendererManager);
        });
    }

    public update(deltaSeconds: number): void {
        this.elapsedSeconds += deltaSeconds;
        this.elapsedSeconds %= 24 * 60 * 60;
    }
}

function getRaymarchedBodyDefine(raymarchedBody: DeepReadonly<RaymarchedBodyModel>): string {
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

function setRaymarchedBodyUniforms(
    effect: Effect,
    raymarchedBody: DeepReadonly<RaymarchedBodyModel>,
    averageScreenSize: number,
): void {
    effect.setFloat(RaymarchedBodyUniformNames.AVERAGE_SCREEN_SIZE, averageScreenSize);

    switch (raymarchedBody.type) {
        case "mandelbulb":
            effect.setColor3(RaymarchedBodyUniformNames.ACCENT_COLOR, raymarchedBody.accentColor);
            effect.setFloat(RaymarchedBodyUniformNames.MANDELBULB_POWER, raymarchedBody.power);
            break;
        case "juliaSet":
            effect.setColor3(RaymarchedBodyUniformNames.ACCENT_COLOR, raymarchedBody.accentColor);
            break;
        case "mandelbox":
            effect.setColor3(RaymarchedBodyUniformNames.ACCENT_COLOR, raymarchedBody.color);
            effect.setFloat(RaymarchedBodyUniformNames.MANDELBOX_MR2, raymarchedBody.mr2);
            effect.setFloat(RaymarchedBodyUniformNames.MANDELBOX_SPREAD, raymarchedBody.spread);
            break;
        case "sierpinskiPyramid":
            effect.setColor3(RaymarchedBodyUniformNames.ACCENT_COLOR, raymarchedBody.accentColor);
            break;
        case "mengerSponge":
            effect.setColor3(RaymarchedBodyUniformNames.ACCENT_COLOR, raymarchedBody.color);
            break;
        default:
            return assertUnreachable(raymarchedBody);
    }
}
