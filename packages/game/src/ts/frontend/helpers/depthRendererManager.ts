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

import "@babylonjs/core/Rendering/depthRendererSceneComponent";

import type { Camera } from "@babylonjs/core/Cameras/camera";
import type { TextureSize } from "@babylonjs/core/Materials/Textures/textureCreationOptions";
import type { DepthRenderer } from "@babylonjs/core/Rendering/depthRenderer";
import type { Scene } from "@babylonjs/core/scene";

/**
 * Manages depth renderers for multiple cameras in a scene
 */
export class DepthRendererManager {
    private readonly cameraToDepthRenderer = new Map<Camera, DepthRenderer>();
    private readonly scene: Scene;
    private activeCamera: Camera | null = null;

    constructor(scene: Scene) {
        this.scene = scene;
        this.scene.onCameraRemovedObservable.add((camera) => {
            const depthRenderer = this.cameraToDepthRenderer.get(camera);
            if (depthRenderer !== undefined) {
                depthRenderer.dispose();
                this.cameraToDepthRenderer.delete(camera);
            }
        });

        this.scene.getEngine().onResizeObservable.add((engine) => {
            const newSize = {
                width: engine.getRenderWidth(),
                height: engine.getRenderHeight(),
            } satisfies TextureSize;
            for (const depthRenderer of this.cameraToDepthRenderer.values()) {
                depthRenderer.getDepthMap().resize(newSize);
            }
        });

        for (const camera of this.scene.cameras) {
            this.getDepthRenderer(camera);
        }

        if (this.scene.activeCamera !== null) {
            this.setActiveCamera(this.scene.activeCamera);
        }
    }

    /**
     * Disables the depth renderer for all cameras but the given one
     * @param camera The camera for which to enable the depth renderer
     */
    setActiveCamera(camera: Camera): void {
        if (camera === this.activeCamera) {
            return;
        }

        for (const depthRenderer of this.cameraToDepthRenderer.values()) {
            depthRenderer.enabled = false;
        }

        this.activeCamera = camera;
        const depthRenderer = this.getDepthRenderer(camera);
        depthRenderer.enabled = true;
    }

    /**
     * Gets the depth renderer associated to the given camera, creating it if it doesn't exist yet
     * @param camera The camera to get the depth renderer for
     * @returns The depth renderer associated to the camera
     */
    getDepthRenderer(camera: Camera): DepthRenderer {
        let depthRenderer = this.cameraToDepthRenderer.get(camera);
        if (depthRenderer === undefined) {
            depthRenderer = this.scene.enableDepthRenderer(camera, false, true);
            this.cameraToDepthRenderer.set(camera, depthRenderer);
        }

        return depthRenderer;
    }

    dispose(): void {
        for (const depthRenderer of this.cameraToDepthRenderer.values()) {
            depthRenderer.dispose();
        }
        this.cameraToDepthRenderer.clear();
        this.activeCamera = null;
    }
}
