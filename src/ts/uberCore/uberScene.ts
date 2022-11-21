import { DepthRenderer, Engine, Scene, ScenePerformancePriority } from "@babylonjs/core";
import { AbstractController } from "./abstractController";
import { UberCamera } from "./uberCamera";

export class UberScene extends Scene {
    activeController: AbstractController | null = null;

    private depthRenderer: DepthRenderer | null = null;

    constructor(engine: Engine) {
        super(engine);
        this.performancePriority = ScenePerformancePriority.Intermediate;
    }

    public getDepthRenderer(): DepthRenderer {
        if (this.depthRenderer === null) throw new Error("Depth Renderer not initialized");
        return this.depthRenderer;
    }

    public setActiveController(controller: AbstractController) {
        this.activeController = controller;
        this.activeCamera = controller.getActiveCamera();
        if (this.depthRenderer === null) {
            this.depthRenderer = this.enableDepthRenderer(null, false, true);
            this.customRenderTargets.push(this.depthRenderer.getDepthMap());
        }
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
