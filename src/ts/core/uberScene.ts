import {
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

export class UberScene extends Scene {
    activeController: AbstractController | null = null;

    readonly spaceRenderingPipeline: SpaceRenderingPipeline;
    readonly surfaceRenderingPipeline: SurfaceRenderingPipeline;
    readonly pipelines: AbstractRenderingPipeline[];

    readonly colorCorrection: ColorCorrection;
    readonly fxaa: FxaaPostProcess;


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

    public setActiveController(controller: AbstractController) {
        this.activeController = controller;
        this.activeCamera = controller.getActiveCamera();
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

        const activeCamera = this.getActiveUberCamera();
        const nearestBody = this.getActiveController().getNearestBody();

        this.spaceRenderingPipeline.setBody(this.getActiveController().getNearestBody());
        this.surfaceRenderingPipeline.setBody(this.getActiveController().getNearestBody());

        const switchLimit = nearestBody.postProcesses.rings?.settings.ringStart || 2;
        if (this.getActiveController().isOrbiting(nearestBody, switchLimit)) {
            if (!this.surfaceRenderingPipeline.cameras.includes(activeCamera)) {
                if(this.spaceRenderingPipeline.cameras.includes(activeCamera)) this.spaceRenderingPipeline.detachCamera(activeCamera);
                this.surfaceRenderingPipeline.attachToCamera(activeCamera);
            }
        } else {
            if (!this.spaceRenderingPipeline.cameras.includes(activeCamera)) {
                if(this.surfaceRenderingPipeline.cameras.includes(activeCamera)) this.surfaceRenderingPipeline.detachCamera(activeCamera);
                this.spaceRenderingPipeline.attachToCamera(activeCamera);
            }
        }
    }
}
