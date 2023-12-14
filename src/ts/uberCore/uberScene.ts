import { Scene, ScenePerformancePriority } from "@babylonjs/core/scene";
import { AbstractController } from "./abstractController";
import { UberCamera } from "./uberCamera";
import { DepthRenderer } from "@babylonjs/core/Rendering/depthRenderer";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import { Camera } from "@babylonjs/core/Cameras/camera";

export class UberScene extends Scene {
    activeController: AbstractController | null = null;

    private depthRenderer: DepthRenderer | null = null;

    constructor(engine: Engine, performancePriority = ScenePerformancePriority.BackwardCompatible) {
        super(engine);
        this.performancePriority = performancePriority;
    }

    public getDepthRenderer(): DepthRenderer {
        if (this.depthRenderer === null) throw new Error("Depth Renderer not initialized");
        return this.depthRenderer;
    }

    public setActiveController(controller: AbstractController) {
        this.activeController = controller;
        this.setActiveCamera(controller.getActiveCamera());
    }

    public setActiveCamera(camera: Camera) {
        if (this.activeCamera !== null) this.activeCamera.detachControl(this.getEngine().getRenderingCanvas());
        this.activeCamera = camera;
        camera.attachControl(this.getEngine().getRenderingCanvas(), true);

        if (this.depthRenderer !== null) this.depthRenderer.dispose();
        this.depthRenderer = this.enableDepthRenderer(null, false, true);
    }

    public getActiveController(): AbstractController {
        if (this.activeController === null) throw new Error("Controller not set");
        return this.activeController;
    }

    public getActiveUberCamera(): UberCamera {
        if (this.getActiveController().getActiveCamera() === null) throw new Error("No active Uber Camera");
        return this.getActiveController().getActiveCamera();
    }
}
