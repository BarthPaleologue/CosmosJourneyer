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
import { Matrix } from "@babylonjs/core/Maths/math";
import { Vector3, Vector4 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { type Scene } from "@babylonjs/core/scene";

import type { RGBColor } from "@/utils/colors";

import { OffsetViewProjectionToRef } from "../helpers/floatingOrigin";
import { CameraUniformNames, setCameraUniforms } from "./uniforms/cameraUniforms";
import { ObjectUniformNames, setObjectUniforms } from "./uniforms/objectUniforms";
import { SamplerUniformNames, setSamplerUniforms } from "./uniforms/samplerUniforms";

import lensFlareFragment from "@shaders/lensflare.glsl";

export class LensFlarePostProcess extends PostProcess {
    private activeCamera: Camera | null = null;

    private readonly clipPosition = Vector3.Zero();

    private readonly frontClipPosition = Vector3.Zero();

    private readonly upClipPosition = Vector3.Zero();

    private readonly rightClipPosition = Vector3.Zero();

    private readonly cameraToStellarObject = Vector3.Zero();

    constructor(stellarTransform: TransformNode, boundingRadius: number, color: RGBColor, scene: Scene) {
        const shaderName = "lensflare";
        if (Effect.ShadersStore[`${shaderName}FragmentShader`] === undefined) {
            Effect.ShadersStore[`${shaderName}FragmentShader`] = lensFlareFragment;
        }

        const LensFlareUniformNames = {
            FLARE_COLOR: "flareColor",
            CLIP_POSITION: "clipPosition",
            VISIBILITY: "visibility",
            ASPECT_RATIO: "aspectRatio",
            FRONT_DEPTH: "frontDepth",
            SCREEN_RADIUS: "screenRadius",
        };

        const uniforms: string[] = [
            ...Object.values(ObjectUniformNames),
            ...Object.values(CameraUniformNames),
            ...Object.values(LensFlareUniformNames),
        ];

        const samplers: string[] = Object.values(SamplerUniformNames);

        super(
            stellarTransform.name + "LensFlare",
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

        const flareColor = color;

        this.onActivateObservable.add((camera) => {
            this.activeCamera = camera;
        });

        const tempViewProjection = new Matrix();
        const tempStellarObjectPosition = new Vector3();
        const tempFrontWorldPosition = new Vector3();
        const tempFrontProjectedPosition = new Vector3();
        const tempUpOffset = new Vector3();
        const tempUpPosition = new Vector3();
        const tempRightOffset = new Vector3();
        const tempRightPosition = new Vector3();
        const tempClipSpacePosition = new Vector4();

        this.onApplyObservable.add((effect) => {
            if (this.activeCamera === null) {
                console.warn("Camera is null");
                return;
            }

            const floatingOriginOffset = scene.floatingOriginOffset;
            const floatingOriginEnabled = scene.floatingOriginMode;

            setCameraUniforms(effect, this.activeCamera, floatingOriginEnabled);
            setObjectUniforms(effect, stellarTransform, boundingRadius, floatingOriginOffset);

            effect.setColor3(LensFlareUniformNames.FLARE_COLOR, flareColor);

            const viewProjection = OffsetViewProjectionToRef(
                this.activeCamera.getViewMatrix(),
                this.activeCamera.getProjectionMatrix(),
                tempViewProjection,
            );
            const fullViewProjection = scene.getTransformMatrix();
            const computeDepthMetric = (camera: Camera, worldPosition: Vector3): number => {
                Vector4.TransformCoordinatesToRef(worldPosition, fullViewProjection, tempClipSpacePosition);
                const engine = scene.getEngine();
                if (engine.useReverseDepthBuffer) {
                    return (-tempClipSpacePosition.z + camera.minZ) / (camera.minZ + camera.maxZ);
                }

                return (tempClipSpacePosition.z + camera.minZ) / (camera.minZ + camera.maxZ);
            };
            const absolutePosition = stellarTransform.getAbsolutePosition();
            Vector3.ProjectToRef(
                absolutePosition.subtractToRef(floatingOriginOffset, tempStellarObjectPosition),
                Matrix.IdentityReadOnly,
                viewProjection,
                this.activeCamera.viewport,
                this.clipPosition,
            );
            this.clipPosition.z = computeDepthMetric(this.activeCamera, absolutePosition);
            effect.setVector3(LensFlareUniformNames.CLIP_POSITION, this.clipPosition);

            const localForward = Vector3.Forward(scene.useRightHandedSystem);
            const cameraForward = this.activeCamera.getDirection(localForward);
            const cameraPosition = this.activeCamera.globalPosition;
            const cameraToStellar = absolutePosition.subtractToRef(cameraPosition, this.cameraToStellarObject);
            const distanceToCenter = cameraToStellar.length();
            const isBehindCamera =
                Vector3.Dot(cameraForward, cameraToStellar) < 0 || distanceToCenter <= boundingRadius;

            const cameraUp = this.activeCamera.getDirection(Vector3.UpReadOnly);
            const cameraRight = this.activeCamera.getDirection(Vector3.RightReadOnly);

            const frontSurfaceDistance = Math.max(distanceToCenter - boundingRadius, this.activeCamera.minZ);
            const frontSurfacePosition = cameraToStellar
                .normalizeToRef(tempFrontWorldPosition)
                .scaleInPlace(frontSurfaceDistance)
                .addInPlace(cameraPosition);
            Vector3.ProjectToRef(
                frontSurfacePosition.subtractToRef(floatingOriginOffset, tempFrontProjectedPosition),
                Matrix.IdentityReadOnly,
                viewProjection,
                this.activeCamera.viewport,
                this.frontClipPosition,
            );
            this.frontClipPosition.z = computeDepthMetric(this.activeCamera, frontSurfacePosition);

            cameraUp.scaleToRef(boundingRadius, tempUpOffset);
            absolutePosition.addToRef(tempUpOffset, tempUpPosition);
            Vector3.ProjectToRef(
                tempUpPosition.subtractToRef(floatingOriginOffset, tempUpPosition),
                Matrix.IdentityReadOnly,
                viewProjection,
                this.activeCamera.viewport,
                this.upClipPosition,
            );

            cameraRight.scaleToRef(boundingRadius, tempRightOffset);
            absolutePosition.addToRef(tempRightOffset, tempRightPosition);
            Vector3.ProjectToRef(
                tempRightPosition.subtractToRef(floatingOriginOffset, tempRightPosition),
                Matrix.IdentityReadOnly,
                viewProjection,
                this.activeCamera.viewport,
                this.rightClipPosition,
            );

            const isOffscreen =
                this.clipPosition.x < 0.0 ||
                this.clipPosition.x > 1.0 ||
                this.clipPosition.y < 0.0 ||
                this.clipPosition.y > 1.0;
            effect.setFloat(LensFlareUniformNames.VISIBILITY, isBehindCamera || isOffscreen ? 0 : 1);

            effect.setFloat(LensFlareUniformNames.ASPECT_RATIO, scene.getEngine().getScreenAspectRatio());
            effect.setFloat(LensFlareUniformNames.FRONT_DEPTH, this.frontClipPosition.z);
            effect.setFloat2(
                LensFlareUniformNames.SCREEN_RADIUS,
                Math.abs(this.rightClipPosition.x - this.clipPosition.x),
                Math.abs(this.upClipPosition.y - this.clipPosition.y),
            );

            setSamplerUniforms(effect, this.activeCamera, scene);
        });
    }
}
