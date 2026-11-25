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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Constants } from "@babylonjs/core/Engines/constants";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Matrix, Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import type { Scene } from "@babylonjs/core/scene";

import type { DepthRendererManager } from "../helpers/depthRendererManager";
import { OffsetViewProjectionToRef } from "../helpers/floatingOrigin";
import type { LensFlareSource } from "../helpers/stellarLightSystem";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";

import lensFlareFragment from "@shaders/lensflare.glsl";

const LensFlareUniformNames = {
    VISIBLE_SOURCE_COUNT: "visibleSourceCount",
    SOURCE_SPHERES: "sourceSpheres",
    SOURCE_COLORS: "sourceColors",
    SOURCE_PROJECTIONS: "sourceProjections",
    SOURCE_SCREEN_RADII: "sourceScreenRadii",
    ASPECT_RATIO: "aspectRatio",
};

/**
 * @param sourceCount Number of sources to accommodate.
 * @returns Packed uniform arrays and their shader capacity.
 */
function createSourceUniforms(sourceCount: number) {
    // GLSL arrays need a positive size even when the system has no emitters.
    const capacity = Math.max(1, sourceCount);
    return {
        capacity,
        defines: `#define LENS_FLARE_SOURCE_CAPACITY ${capacity}`,
        spheres: new Float32Array(capacity * 4),
        colors: new Float32Array(capacity * 3),
        projections: new Float32Array(capacity * 4),
        screenRadii: new Float32Array(capacity * 2),
    };
}

export class LensFlarePostProcess {
    private readonly postProcess: PostProcess;

    private sources: ReadonlyArray<Readonly<LensFlareSource>>;

    private sourceUniforms: ReturnType<typeof createSourceUniforms>;

    constructor(
        sources: ReadonlyArray<Readonly<LensFlareSource>>,
        depthRendererManager: DepthRendererManager,
        scene: Scene,
    ) {
        const shaderName = "lensflare";
        Effect.ShadersStore[`${shaderName}FragmentShader`] ??= lensFlareFragment;

        this.sources = sources;
        this.sourceUniforms = createSourceUniforms(sources.length);

        const engine = scene.getEngine();
        this.postProcess = new PostProcess(
            "lensFlare",
            shaderName,
            [...Object.values(CameraUniformNames), ...Object.values(LensFlareUniformNames)],
            Object.values(SamplerUniformNames),
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            this.sourceUniforms.defines,
            Constants.TEXTURETYPE_HALF_FLOAT,
        );

        let activeCamera: Camera | null = null;
        this.postProcess.onActivateObservable.add((camera) => {
            activeCamera = camera;
        });

        const viewProjection = new Matrix();
        const relativePosition = new Vector3();
        const cameraToSource = new Vector3();
        const frontSurfacePosition = new Vector3();
        const clipPosition = new Vector4();
        const screenPosition = new Vector3();
        const offsetPosition = new Vector3();
        const offsetScreenPosition = new Vector3();
        const localForward = Vector3.Forward(scene.useRightHandedSystem);

        const projectDepth = (position: Vector3, fullViewProjection: Matrix, camera: Camera): number => {
            Vector4.TransformCoordinatesToRef(position, fullViewProjection, clipPosition);
            const depth = engine.useReverseDepthBuffer ? -clipPosition.z : clipPosition.z;
            return (depth + camera.minZ) / (camera.minZ + camera.maxZ);
        };

        this.postProcess.onApplyObservable.add((effect) => {
            if (this.sources.length === 0) {
                effect.setInt(LensFlareUniformNames.VISIBLE_SOURCE_COUNT, 0);
                return;
            }

            if (activeCamera === null) {
                console.warn("Camera is null");
                return;
            }

            const camera = activeCamera;
            const cameraPosition = camera.globalPosition;
            const cameraForward = camera.getDirection(localForward);
            const cameraUp = camera.getDirection(Vector3.UpReadOnly);
            const cameraRight = camera.getDirection(Vector3.RightReadOnly);
            const viewport = camera.viewport;
            const floatingOriginOffset = scene.floatingOriginOffset;
            OffsetViewProjectionToRef(camera.getViewMatrix(), camera.getProjectionMatrix(), viewProjection);
            const fullViewProjection = scene.getTransformMatrix();

            const {
                spheres: sourceSpheres,
                colors: sourceColors,
                projections: sourceProjections,
                screenRadii: sourceScreenRadii,
            } = this.sourceUniforms;
            let visibleSourceCount = 0;
            for (const { transform, boundingRadius, color } of this.sources) {
                const absolutePosition = transform.getAbsolutePosition();
                absolutePosition.subtractToRef(cameraPosition, cameraToSource);
                const distanceToCenter = cameraToSource.length();
                if (Vector3.Dot(cameraForward, cameraToSource) < 0 || distanceToCenter <= boundingRadius) {
                    continue;
                }

                absolutePosition.subtractToRef(floatingOriginOffset, relativePosition);
                Vector3.ProjectToRef(
                    relativePosition,
                    Matrix.IdentityReadOnly,
                    viewProjection,
                    viewport,
                    screenPosition,
                );
                if (screenPosition.x < 0 || screenPosition.x > 1 || screenPosition.y < 0 || screenPosition.y > 1) {
                    continue;
                }

                const frontSurfaceDistance = Math.max(distanceToCenter - boundingRadius, camera.minZ);
                cameraToSource
                    .normalizeToRef(frontSurfacePosition)
                    .scaleInPlace(frontSurfaceDistance)
                    .addInPlace(cameraPosition);

                cameraRight.scaleToRef(boundingRadius, offsetPosition).addInPlace(relativePosition);
                Vector3.ProjectToRef(
                    offsetPosition,
                    Matrix.IdentityReadOnly,
                    viewProjection,
                    viewport,
                    offsetScreenPosition,
                );
                const screenRadiusX = Math.abs(offsetScreenPosition.x - screenPosition.x);

                cameraUp.scaleToRef(boundingRadius, offsetPosition).addInPlace(relativePosition);
                Vector3.ProjectToRef(
                    offsetPosition,
                    Matrix.IdentityReadOnly,
                    viewProjection,
                    viewport,
                    offsetScreenPosition,
                );
                const screenRadiusY = Math.abs(offsetScreenPosition.y - screenPosition.y);

                const sphereOffset = visibleSourceCount * 4;
                sourceSpheres[sphereOffset] = relativePosition.x;
                sourceSpheres[sphereOffset + 1] = relativePosition.y;
                sourceSpheres[sphereOffset + 2] = relativePosition.z;
                sourceSpheres[sphereOffset + 3] = boundingRadius;

                const colorOffset = visibleSourceCount * 3;
                sourceColors[colorOffset] = color.r;
                sourceColors[colorOffset + 1] = color.g;
                sourceColors[colorOffset + 2] = color.b;

                const projectionOffset = visibleSourceCount * 4;
                sourceProjections[projectionOffset] = screenPosition.x;
                sourceProjections[projectionOffset + 1] = 1 - screenPosition.y;
                sourceProjections[projectionOffset + 2] = projectDepth(absolutePosition, fullViewProjection, camera);
                sourceProjections[projectionOffset + 3] = projectDepth(
                    frontSurfacePosition,
                    fullViewProjection,
                    camera,
                );

                const radiusOffset = visibleSourceCount * 2;
                sourceScreenRadii[radiusOffset] = screenRadiusX;
                sourceScreenRadii[radiusOffset + 1] = screenRadiusY;

                visibleSourceCount++;
            }

            effect.setInt(LensFlareUniformNames.VISIBLE_SOURCE_COUNT, visibleSourceCount);
            if (visibleSourceCount === 0) {
                return;
            }

            setCameraUniforms(effect, camera, scene.floatingOriginMode);
            effect.setFloat(LensFlareUniformNames.ASPECT_RATIO, engine.getScreenAspectRatio());
            effect.setFloatArray4(LensFlareUniformNames.SOURCE_SPHERES, sourceSpheres);
            effect.setFloatArray3(LensFlareUniformNames.SOURCE_COLORS, sourceColors);
            effect.setFloatArray4(LensFlareUniformNames.SOURCE_PROJECTIONS, sourceProjections);
            effect.setFloatArray2(LensFlareUniformNames.SOURCE_SCREEN_RADII, sourceScreenRadii);
            setSamplerUniforms(effect, camera, depthRendererManager);
        });
    }

    public setSources(sources: ReadonlyArray<Readonly<LensFlareSource>>): void {
        this.sources = sources;
        if (sources.length > this.sourceUniforms.capacity) {
            this.sourceUniforms = createSourceUniforms(sources.length);
            this.postProcess.updateEffect(this.sourceUniforms.defines);
        }
    }

    get(): PostProcess {
        return this.postProcess;
    }
}
