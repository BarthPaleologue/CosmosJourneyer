import { Engine, FreeCamera, Nullable, Scene, ScenePerformancePriority } from "@babylonjs/core";
import { StarSystem } from "../bodies/starSystem";
import { SpaceRenderingPipeline } from "../postProcesses/pipelines/spaceRenderingPipeline";
import { SurfaceRenderingPipeline } from "../postProcesses/pipelines/surfaceRenderingPipeline";
import { AbstractRenderingPipeline } from "../postProcesses/pipelines/abstractRenderingPipeline";
import { ChunkForge } from "../chunks/chunkForge";
import { Settings } from "../settings";
import { AbstractController } from "../controllers/abstractController";
import { ColorCorrection } from "../postProcesses/colorCorrection";
import { OverlayPostProcess } from "../postProcesses/overlayPostProcess";
import { UberFreeCamera } from "./uberFreeCamera";

export class UberScene extends Scene {
    starSystem: StarSystem | null = null;

    activeUberCamera: UberFreeCamera | null = null;

    controller: AbstractController | null = null;

    readonly spaceRenderingPipeline: SpaceRenderingPipeline;
    readonly surfaceRenderingPipeline: SurfaceRenderingPipeline;
    readonly pipelines: AbstractRenderingPipeline[];

    readonly colorCorrection: ColorCorrection;
    readonly overlay: OverlayPostProcess;

    isOverlayEnabled = true;

    readonly _chunkForge: ChunkForge;

    constructor(engine: Engine, nbVertices = Settings.VERTEX_RESOLUTION) {
        super(engine);
        this.performancePriority = ScenePerformancePriority.Intermediate;

        this.spaceRenderingPipeline = new SpaceRenderingPipeline("spaceRenderingPipeline", this);
        this.surfaceRenderingPipeline = new SurfaceRenderingPipeline("surfaceRenderingPipeline", this);
        this.pipelines = [this.spaceRenderingPipeline, this.surfaceRenderingPipeline];

        this.colorCorrection = new ColorCorrection("colorCorrection", this);
        this.overlay = new OverlayPostProcess("overlay", this);

        this._chunkForge = new ChunkForge(nbVertices);
    }
    public setStarSystem(starSystem: StarSystem) {
        this.starSystem = starSystem;
    }
    public getStarSystem(): StarSystem {
        if(this.starSystem === null) throw new Error("Star system not set");
        return this.starSystem;
    }
    public setController(player: AbstractController) {
        this.controller = player;
    }
    public getController(): AbstractController {
        if(this.controller === null) throw new Error("Controller not set");
        return this.controller;
    }
    public setActiveUberCamera(uberCamera: UberFreeCamera) {
        this.activeUberCamera = uberCamera;
        this.activeCamera = uberCamera;
    }
    public getActiveUberCamera(): UberFreeCamera {
        if(this.activeUberCamera == null) throw new Error("No active Uber Camera");
        return this.activeUberCamera;
    }

    public update(deltaTime: number) {
        this._chunkForge.update();
        if(this.starSystem && this.controller) this.starSystem.update(deltaTime);

        const switchLimit = this.getController().getNearestBody().postProcesses.rings?.settings.ringStart || 2;
        if (this.getController().isOrbiting(this.getController().getNearestBody(), switchLimit)) {
            if (this.spaceRenderingPipeline.cameras.length > 0) {
                this.spaceRenderingPipeline.detachCameras();
                this.surfaceRenderingPipeline.attachToCamera(this.getController().getActiveCamera());
            }
        } else {
            if (this.surfaceRenderingPipeline.cameras.length > 0) {
                this.surfaceRenderingPipeline.detachCameras();
                this.spaceRenderingPipeline.attachToCamera(this.getController().getActiveCamera());
            }
        }
    }

    public initPostProcesses() {
        this.spaceRenderingPipeline.init();
        this.surfaceRenderingPipeline.init();
        this.spaceRenderingPipeline.attachToCamera(this.getController().getActiveCamera());
    }
}