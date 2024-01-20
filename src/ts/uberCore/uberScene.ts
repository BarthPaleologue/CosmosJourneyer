//  This file is part of CosmosJourneyer
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
import { DepthRenderer } from "@babylonjs/core/Rendering/depthRenderer";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Color4 } from "@babylonjs/core/Maths/math.color";

export class UberScene extends Scene {
    private activeController: Controls | null = null;
    private depthRenderer: DepthRenderer | null = null;

    constructor(engine: Engine, performancePriority = ScenePerformancePriority.BackwardCompatible) {
        super(engine);
        this.performancePriority = performancePriority;
        this.clearColor = new Color4(0, 0, 0, 0);
    }

    public getDepthRenderer(): DepthRenderer {
        if (this.depthRenderer === null) throw new Error("Depth Renderer not initialized");
        return this.depthRenderer;
    }

    public setActiveController(controller: Controls) {
        this.activeController = controller;
        this.setActiveCamera(controller.getActiveCamera());
    }

    public setActiveCamera(camera: Camera) {
        if (this.activeCamera !== null) this.activeCamera.detachControl();
        this.activeCamera = camera;
        camera.attachControl(true);

        if (this.depthRenderer !== null) this.depthRenderer.dispose();
        this.depthRenderer = this.enableDepthRenderer(null, false, true);
    }

    public getActiveController(): Controls {
        if (this.activeController === null) throw new Error("Controller not set");
        return this.activeController;
    }

    public getActiveCamera(): Camera {
        if (this.activeCamera === null) throw new Error("Camera not set");
        return this.activeCamera;
    }
}
