import {
    DepthRenderer,
    Engine,
    FxaaPostProcess,
    Scene,
    ScenePerformancePriority,
    Texture
} from "@babylonjs/core";
import { SpaceRenderingPipeline } from "../postProcesses/pipelines/spaceRenderingPipeline";
import { SurfaceRenderingPipeline } from "../postProcesses/pipelines/surfaceRenderingPipeline";
import { AbstractRenderingPipeline } from "../postProcesses/pipelines/abstractRenderingPipeline";
import { ChunkForge } from "../chunks/chunkForge";
import { Settings } from "../settings";
import { AbstractController } from "../controllers/abstractController";
import { ColorCorrection } from "../postProcesses/colorCorrection";
import { UberFreeCamera } from "./uberFreeCamera";
import { isOrbiting } from "../utils/positionNearBody";

export class UberScene extends Scene {
    activeController: AbstractController | null = null;

    readonly spaceRenderingPipeline: SpaceRenderingPipeline;
    readonly surfaceRenderingPipeline: SurfaceRenderingPipeline;
    readonly pipelines: AbstractRenderingPipeline[];

    readonly colorCorrection: ColorCorrection;
    readonly fxaa: FxaaPostProcess;

    private depthRenderer: DepthRenderer | null = null;

    readonly _chunkForge: ChunkForge;

    constructor(engine: Engine, nbVertices = Settings.VERTEX_RESOLUTION) {
        super(engine);
        this.performancePriority = ScenePerformancePriority.Intermediate;

        this.spaceRenderingPipeline = new SpaceRenderingPipeline("spaceRenderingPipeline", this);
        this.surfaceRenderingPipeline = new SurfaceRenderingPipeline("surfaceRenderingPipeline", this);
        this.pipelines = [this.spaceRenderingPipeline, this.surfaceRenderingPipeline];

        this.colorCorrection = new ColorCorrection("colorCorrection", this);
        //this.overlay = new OverlayPostProcess("overlay", this, this.starSystem);
        this.fxaa = new FxaaPostProcess("fxaa", 1, null, Texture.BILINEAR_SAMPLINGMODE, engine);

        this._chunkForge = new ChunkForge(nbVertices);
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

    public getActiveUberCamera(): UberFreeCamera {
        if (this.getActiveController().getActiveCamera() === null) throw new Error("No active Uber Camera");
        return this.getActiveController().getActiveCamera();
    }

    public enableSurfaceRenderingPipeline() {
        const activeCamera = this.getActiveUberCamera();
        if (!this.surfaceRenderingPipeline.cameras.includes(activeCamera)) {
            if (this.spaceRenderingPipeline.cameras.includes(activeCamera)) this.spaceRenderingPipeline.detachCamera(activeCamera);
            this.surfaceRenderingPipeline.attachToCamera(activeCamera);
        }
    }

    public enableSpaceRenderingPipeline() {
        const activeCamera = this.getActiveUberCamera();
        if (!this.spaceRenderingPipeline.cameras.includes(activeCamera)) {
            if(this.surfaceRenderingPipeline.cameras.includes(activeCamera)) this.surfaceRenderingPipeline.detachCamera(activeCamera);
            this.spaceRenderingPipeline.attachToCamera(activeCamera);
        }
    }

    public update() {
        this._chunkForge.update();

        const nearestBody = this.getActiveController().getNearestBody();

        this.spaceRenderingPipeline.setBody(this.getActiveController().getNearestBody());
        this.surfaceRenderingPipeline.setBody(this.getActiveController().getNearestBody());

        const switchLimit = nearestBody.postProcesses.rings?.settings.ringStart || 2;
        if (isOrbiting(this.getActiveController(), nearestBody, switchLimit)) {
            this.enableSurfaceRenderingPipeline();
        } else {
            this.enableSpaceRenderingPipeline();
        }
    }
}
