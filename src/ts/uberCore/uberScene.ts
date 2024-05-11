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

import { Scene, ScenePerformancePriority } from "@babylonjs/core/scene";
import { Controls } from "./controls";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Color4 } from "@babylonjs/core/Maths/math.color";

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

    /**
     * Creates a new UberScene.
     * @param engine The BabylonJS engine.
     * @param performancePriority The performance priority of the scene (default: ScenePerformancePriority.BackwardCompatible).
     */
    constructor(engine: Engine, performancePriority = ScenePerformancePriority.BackwardCompatible) {
        super(engine);
        this.performancePriority = performancePriority;
        this.clearColor = new Color4(0, 0, 0, 0);
    }

    /**
     * Sets the active controls for the scene. This also sets the active camera of the scene using the active camera of the controls.
     * @param controls The active controls.
     */
    public setActiveControls(controls: Controls) {
        this.activeControls = controls;
        this.setActiveCameras(controls.getActiveCameras());
    }

    /**
     * Sets the active cameras for the scene and the depth renderer. If the depth renderer does not exist, it is created.
     * @param cameras The new active cameras.
     */
    public setActiveCameras(cameras: Camera[]) {
        if (this.activeCameras !== null) this.activeCameras.forEach((camera) => camera.detachControl());
        this.activeCameras = cameras;
        console.log(this.activeCameras, this.activeCamera);
        if (cameras.length === 1) cameras[0].attachControl(true);

        if(this._depthRenderer === undefined || this._depthRenderer === null) {
            this._depthRenderer = {};
        }

        const depthRenderers = Object.values(this._depthRenderer);

        // for each camera, if it has no depth renderer, create one
        cameras.forEach((camera) => {
            if (depthRenderers.find((depthRenderer) => depthRenderer.getDepthMap().activeCamera === camera) === undefined) {
                const depthRenderer = this.enableDepthRenderer(camera, false, true);
                depthRenderer.useOnlyInActiveCamera = true;
            }
        });

        // for each depth renderer, if its active camera is not in the list of active cameras, disable it
        depthRenderers.forEach((depthRenderer) => {
            const camera = depthRenderer.getDepthMap().activeCamera;
            if(camera === null) throw new Error("Found a depth renderer with no camera attached! Log: " + depthRenderer);
            depthRenderer.enabled = cameras.includes(camera);
        });

        console.log(this._depthRenderer);
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
        if (this.activeCameras === null) throw new Error("No active camera in scene: " + this);
        return this.activeCameras;
    }
}
