import {
    DepthRenderer,
    Engine,
    FxaaPostProcess,
    Scene,
    ScenePerformancePriority,
    Texture
} from "@babylonjs/core";
import { UberRenderingPipeline } from "../postProcesses/pipelines/uberRenderingPipeline";
import { ChunkForge } from "../chunks/chunkForge";
import { Settings } from "../settings";
import { AbstractController } from "../controllers/abstractController";
import { ColorCorrection } from "../postProcesses/colorCorrection";
import { UberFreeCamera } from "./uberFreeCamera";
import { isOrbiting } from "../utils/positionNearBody";

export class UberScene extends Scene {
    activeController: AbstractController | null = null;

    readonly uberRenderingPipeline: UberRenderingPipeline;

    readonly colorCorrection: ColorCorrection;
    readonly fxaa: FxaaPostProcess;

    private depthRenderer: DepthRenderer | null = null;

    readonly _chunkForge: ChunkForge;

    constructor(engine: Engine, nbVertices = Settings.VERTEX_RESOLUTION) {
        super(engine);
        this.performancePriority = ScenePerformancePriority.Intermediate;

        this.uberRenderingPipeline = new UberRenderingPipeline("uberRenderingPipeline", this);
        this.postProcessRenderPipelineManager.addPipeline(this.uberRenderingPipeline);

        this.colorCorrection = new ColorCorrection("colorCorrection", this);
        this.fxaa = new FxaaPostProcess("fxaa", 1, null, Texture.BILINEAR_SAMPLINGMODE, engine);

        this.uberRenderingPipeline.colorCorrections.push(this.colorCorrection);
        this.uberRenderingPipeline.fxaas.push(this.fxaa);

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

    public enableSurfaceRenderingPipeline() {
        this.uberRenderingPipeline.setSurfaceOrder();
    }

    public enableSpaceRenderingPipeline() {
        this.uberRenderingPipeline.setSpaceOrder();
    }

    public update() {
        this._chunkForge.update();

        const nearestBody = this.getActiveController().getNearestBody();

        this.uberRenderingPipeline.setBody(this.getActiveController().getNearestBody());

        const switchLimit = 2;//nearestBody.postProcesses.rings?.settings.ringStart || 2;
        if (isOrbiting(this.getActiveController(), nearestBody, switchLimit)) {
            this.enableSurfaceRenderingPipeline();
        } else {
            this.enableSpaceRenderingPipeline();
        }
    }
}
