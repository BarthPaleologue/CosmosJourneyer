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

import "@babylonjs/core/Rendering/depthRendererSceneComponent";

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { type DepthRenderer } from "@babylonjs/core/Rendering/depthRenderer";
import { Scene, type SceneOptions } from "@babylonjs/core/scene";

import { type Controls } from "@/frontend/controls";

/**
 * A very thin wrapper around Babylon's Scene class to add some convenience methods.
 * The functionality added is support for the general purpose controls and the use of a depth renderer by default.
 */
export class UberScene extends Scene {
    /**
     * The active controls for the scene.
     * @private
     */
    private activeControls: Controls | null = null;

    private depthRenderer: DepthRenderer | null = null;

    /**
     * Creates a new UberScene.
     * @param engine The BabylonJS engine.
     */
    constructor(engine: AbstractEngine, options?: SceneOptions) {
        super(engine, options);
        this.clearColor = new Color4(0, 0, 0, 0);

        this.onNewCameraAddedObservable.add((camera) => {
            if (this.depthRenderer === null) {
                this.depthRenderer = this.enableDepthRenderer(camera, false, true);
            }
        });

        this.onBeforeCameraRenderObservable.add((camera) => {
            if (this.depthRenderer === null) {
                throw new Error("Depth renderer is null!");
            }
            this.depthRenderer.getDepthMap().activeCamera = camera;
        });
    }

    /**
     * Sets the active controls for the scene. This also sets the active camera of the scene using the active camera of the controls.
     * @param controls The active controls.
     */
    public async setActiveControls(controls: Controls) {
        this.activeControls = controls;
        this.setActiveCamera(controls.getActiveCamera());

        if (controls.shouldLockPointer()) {
            await this.getEngine().getRenderingCanvas()?.requestPointerLock();
        } else {
            document.exitPointerLock();
        }
    }

    /**
     * Sets the active camera for the scene and the depth renderer. If the depth renderer does not exist, it is created.
     * @param camera The new active camera.
     */
    public setActiveCamera(camera: Camera) {
        if (this.activeCameras !== null)
            this.activeCameras.forEach((camera) => {
                camera.detachControl();
            });
        if (this.activeCamera !== null) this.activeCamera.detachControl();

        this.activeCamera = camera;
        this.activeCameras = [camera];
        camera.attachControl(true);
    }

    /**
     * Returns the active controls for the scene. If they do not exist, it throws an error.
     * @returns The active controls.
     * @throws An error if the active controls do not exist.
     */
    public getActiveControls(): Controls {
        if (this.activeControls === null) throw new Error("Controls not set");
        return this.activeControls;
    }

    /**
     * Returns the active camera for the scene. If it does not exist, it throws an error.
     * @returns The active camera.
     */
    public getActiveCameras(): Camera[] {
        if (this.activeCameras === null) throw new Error("No active camera in scene");
        return this.activeCameras;
    }
}
