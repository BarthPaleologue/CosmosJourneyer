import { HelmetOverlay } from "./ui/helmetOverlay";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor/bodyEditor";
import { initEngineScene } from "./utils/init";
import { Engine, Tools } from "@babylonjs/core";
import { Assets } from "./assets";
import { AbstractController } from "./uberCore/abstractController";
import { UberScene } from "./uberCore/uberScene";
import { StarSystem } from "./bodies/starSystem";
import { CollisionWorker } from "./workers/collisionWorker";
import { isOrbiting } from "./bodies/abstractBody";
import { BodyType } from "./bodies/interfaces";
import { TelluricPlanet } from "./bodies/planets/telluricPlanet";
import { Settings } from "./settings";
import { OverlayPostProcess } from "./postProcesses/overlayPostProcess";

export class PlanetEngine {
    // UI
    private readonly helmetOverlay: HelmetOverlay;
    private readonly bodyEditor: BodyEditor;
    readonly canvas: HTMLCanvasElement;

    // BabylonJS
    private engine: Engine | null = null;
    private scene: UberScene | null = null;

    private starSystem: StarSystem | null = null;

    private readonly collisionWorker = new CollisionWorker();

    constructor() {
        this.helmetOverlay = new HelmetOverlay();
        this.bodyEditor = new BodyEditor();

        this.canvas = document.getElementById("renderer") as HTMLCanvasElement;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.bodyEditor.setCanvas(this.canvas);

        document.addEventListener("keydown", (e) => {
            if (e.key == "o")
                OverlayPostProcess.ARE_ENABLED = !OverlayPostProcess.ARE_ENABLED;
            if (e.key == "p" && this.engine != null && this.scene != null)
                Tools.CreateScreenshotUsingRenderTarget(this.engine, this.scene.getActiveController().getActiveCamera(), { precision: 4 });
            if (e.key == "u")
                this.bodyEditor.setVisibility(this.bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
            //if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
            if (e.key == "w" && this.scene != null && this.starSystem != null && isOrbiting(this.scene.getActiveController(), this.starSystem.getNearestBody()))
                (this.starSystem.getNearestBody() as TelluricPlanet).material.wireframe = !(this.starSystem.getNearestBody() as TelluricPlanet).material.wireframe;
        });
    }

    async setup() {
        [this.engine, this.scene] = await initEngineScene(this.canvas);
        await Assets.Init(this.scene);

        this.scene.executeWhenReady(() => {
            this.getEngine().loadingScreen.hideLoadingUI();
            this.getEngine().runRenderLoop(() => this.getScene().render());
        });

        window.addEventListener("resize", () => {
            this.bodyEditor.resize();
            this.getEngine().resize();
        });

        this.bodyEditor.resize();
    }

    init() {
        if(this.starSystem === null) throw new Error("Star system is null");
        this.starSystem.init();
        this.collisionWorker.setStarSystem(this.starSystem);
        this.collisionWorker.setPlayer(this.getScene().getActiveController());

        this.getScene().registerBeforeRender(() => {
            if(this.engine === null) throw new Error("Engine is null");
            if(this.scene === null) throw new Error("Scene is null");
            if(this.starSystem === null) throw new Error("Star system is null");

            const deltaTime = this.engine.getDeltaTime() / 1000;

            const nearest = this.starSystem.getNearestBody(this.scene.getActiveUberCamera().position);

            this.bodyEditor.update(nearest, this.starSystem.postProcessManager, this.scene);
            this.helmetOverlay.update(nearest);
            this.helmetOverlay.setVisibility(this.bodyEditor.getVisibility() != EditorVisibility.FULL);

            this.starSystem.translateAllBodies(this.scene.getActiveController().update(deltaTime));

            if (!this.collisionWorker.isBusy() && isOrbiting(this.scene.getActiveController(), nearest)) {
                if (nearest.bodyType == BodyType.TELLURIC) {
                    this.collisionWorker.checkCollision(nearest as TelluricPlanet);
                }
            }

            //FIXME: should address stars orbits
            for (const star of this.starSystem.stars) star.descriptor.orbitalProperties.period = 0;

            Assets.ChunkForge.update();
            this.starSystem.update(deltaTime * Settings.TIME_MULTIPLIER);
        });
    }

    setActiveController(controller: AbstractController) {
        this.getScene().setActiveController(controller);
    }

    setStarSystem(starSystem: StarSystem) {
        this.starSystem = starSystem;
    }

    registerUpdateCallback(callback: () => void) {
        this.getScene().registerBeforeRender(callback);
    }

    getScene() {
        if(this.scene === null) throw new Error("Scene is null");
        return this.scene;
    }

    getEngine() {
        if(this.engine === null) throw new Error("Engine is null");
        return this.engine;
    }
}