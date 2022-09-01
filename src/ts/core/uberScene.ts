import { Engine, Scene } from "@babylonjs/core";
import { StarSystem } from "../bodies/starSystem";
import { StarfieldPostProcess } from "../postProcesses/starfieldPostProcess";
import { SpaceRenderingPipeline } from "../postProcesses/pipelines/spaceRenderingPipeline";
import { SurfaceRenderingPipeline } from "../postProcesses/pipelines/surfaceRenderingPipeline";
import { AbstractRenderingPipeline } from "../postProcesses/pipelines/abstractRenderingPipeline";
import { ChunkForge } from "../chunks/chunkForge";
import { Settings } from "../settings";
import { PlayerController } from "../player/playerController";
import { ColorCorrection } from "../postProcesses/colorCorrection";
import { OverlayPostProcess } from "../postProcesses/overlayPostProcess";

export class UberScene extends Scene {
    starSystem: StarSystem | null = null;
    starField: StarfieldPostProcess | null = null;

    player: PlayerController | null = null;

    readonly spaceRenderingPipeline: SpaceRenderingPipeline;
    readonly surfaceRenderingPipeline: SurfaceRenderingPipeline;
    readonly pipelines: AbstractRenderingPipeline[];

    readonly colorCorrection: ColorCorrection;
    readonly overlay: OverlayPostProcess;

    isOverlayEnabled = true;

    readonly _chunkForge: ChunkForge;

    constructor(engine: Engine, nbVertices = Settings.VERTEX_RESOLUTION) {
        super(engine);
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
    public setStarField(starField: StarfieldPostProcess) {
        this.starField = starField;
    }
    public setPlayer(player: PlayerController) {
        this.player = player;
    }
    public getPlayer(): PlayerController {
        if(this.player === null) throw new Error("Player not set");
        return this.player;
    }

    public update(deltaTime: number) {
        if(this.starSystem && this.player) this.starSystem.update(deltaTime);

        const switchLimit = this.getPlayer().nearestBody?.postProcesses.rings?.settings.ringStart || 2;
        if (this.getPlayer().isOrbiting(this.getPlayer().nearestBody, switchLimit)) {
            if (this.spaceRenderingPipeline.cameras.length > 0) {
                this.spaceRenderingPipeline.detachCamera(this.getPlayer().camera);
                this.surfaceRenderingPipeline.attachToCamera(this.getPlayer().camera);
            }
        } else {
            if (this.surfaceRenderingPipeline.cameras.length > 0) {
                this.surfaceRenderingPipeline.detachCamera(this.getPlayer().camera);
                this.spaceRenderingPipeline.attachToCamera(this.getPlayer().camera);
            }
        }
    }
    public initPostProcesses() {
        this.spaceRenderingPipeline.init();
        this.surfaceRenderingPipeline.init();
        this.spaceRenderingPipeline.attachToCamera(this.getPlayer().camera);
    }
}