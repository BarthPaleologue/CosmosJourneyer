import { DepthRenderer, Engine, Scene, ScenePerformancePriority } from "@babylonjs/core";
import { UberRenderingPipeline } from "./uberRenderingPipeline";
import { ChunkForge } from "../chunks/chunkForge";
import { Settings } from "../settings";
import { AbstractController } from "../controllers/abstractController";
import { UberFreeCamera } from "./uberFreeCamera";

export class UberScene extends Scene {
    activeController: AbstractController | null = null;

    readonly uberRenderingPipeline: UberRenderingPipeline;

    private depthRenderer: DepthRenderer | null = null;

    readonly _chunkForge: ChunkForge;

    constructor(engine: Engine, nbVertices = Settings.VERTEX_RESOLUTION) {
        super(engine);
        this.performancePriority = ScenePerformancePriority.Intermediate;

        this.uberRenderingPipeline = new UberRenderingPipeline("uberRenderingPipeline", this.getEngine());
        this.postProcessRenderPipelineManager.addPipeline(this.uberRenderingPipeline);

        this._chunkForge = new ChunkForge(nbVertices);
    }

    public getDepthRenderer(): DepthRenderer {
        if (this.depthRenderer === null) throw new Error("Depth Renderer not initialized");
        return this.depthRenderer;
    }

    public setActiveController(controller: AbstractController) {
        this.activeController = controller;
        this.activeCamera = controller.getActiveCamera();
        this.uberRenderingPipeline.attachToCamera(controller.getActiveCamera());
        if (this.depthRenderer === null) {
            this.depthRenderer = this.enableDepthRenderer(null, false, true);
            this.customRenderTargets.push(this.depthRenderer.getDepthMap());
        }
    }

    public getActiveController(): AbstractController {
        if (this.activeController === null) throw new Error("Controller not set");
        return this.activeController;
    }

    public getActiveUberCamera(): UberFreeCamera {
        if (this.getActiveController().getActiveCamera() === null) throw new Error("No active Uber Camera");
        return this.getActiveController().getActiveCamera();
    }

    public update() {
        this._chunkForge.update();
    }
}
