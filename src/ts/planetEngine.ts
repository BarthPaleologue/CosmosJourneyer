import { HelmetOverlay } from "./ui/helmetOverlay";
import { BodyEditor, EditorVisibility } from "./ui/bodyEditor/bodyEditor";
import { Assets } from "./assets";
import { AbstractController } from "./uberCore/abstractController";
import { UberScene } from "./uberCore/uberScene";
import { StarSystem } from "./bodies/starSystem";
import { CollisionWorker } from "./workers/collisionWorker";
import { TelluricPlanemo } from "./bodies/planemos/telluricPlanemo";
import { Settings } from "./settings";
import { OverlayPostProcess } from "./postProcesses/overlayPostProcess";
import { isOrbiting } from "./utils/nearestBody";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Tools } from "@babylonjs/core/Misc/tools";
import { EngineFactory } from "@babylonjs/core/Engines/engineFactory";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/core/Misc/screenshotTools";
import { StarMap } from "./starmap/starMap";
import { Scene } from "@babylonjs/core/scene";
import { positionNearBody } from "./utils/positionNearBody";

export class PlanetEngine {
    // UI
    private readonly helmetOverlay: HelmetOverlay;
    readonly bodyEditor: BodyEditor;
    readonly canvas: HTMLCanvasElement;

    // BabylonJS
    private engine: Engine | null = null;
    private starSystemScene: UberScene | null = null;

    private starSystem: StarSystem | null = null;
    private starMap: StarMap | null = null;

    private activeScene: Scene | null = null;

    private readonly collisionWorker = new CollisionWorker();

    constructor() {
        this.helmetOverlay = new HelmetOverlay();
        this.bodyEditor = new BodyEditor();

        this.canvas = document.getElementById("renderer") as HTMLCanvasElement;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.bodyEditor.setCanvas(this.canvas);

        //TODO: use the keyboard class
        document.addEventListener("keydown", (e) => {
            if (e.key == "o") OverlayPostProcess.ARE_ENABLED = !OverlayPostProcess.ARE_ENABLED;
            if (e.key == "p")
                Tools.CreateScreenshot(this.getEngine(), this.getStarSystemScene().getActiveController().getActiveCamera(), { precision: 4 });
            if (e.key == "u") this.bodyEditor.setVisibility(this.bodyEditor.getVisibility() == EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
            //if (e.key == "m") mouse.deadAreaRadius == 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
            //if (e.key == "w" && isOrbiting(this.getStarSystemScene().getActiveController(), this.getStarSystem().getNearestBody()))
            //    (this.getStarSystem().getNearestBody() as TelluricPlanemo).material.wireframe = !(this.getStarSystem().getNearestBody() as TelluricPlanemo).material.wireframe;

            if (e.key == "m") this.toggleStarMap();
        });
    }

    public toggleStarMap() {
        if (this.activeScene == this.getStarSystemScene()) {
            if (this.starMap == null) throw new Error("Star map is null");
            this.activeScene = this.starMap.scene;
            this.helmetOverlay.setVisibility(false);
            this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
        } else {
            this.activeScene = this.getStarSystemScene();
            this.helmetOverlay.setVisibility(true);
            this.bodyEditor.setVisibility(EditorVisibility.NAVBAR);
        }
    }

    public async setup() {
        this.engine = await EngineFactory.CreateAsync(this.canvas, {});

        this.engine.loadingScreen.displayLoadingUI();

        console.log(`API: ${this.engine instanceof WebGPUEngine ? "WebGPU" : "WebGL" + this.engine.webGLVersion}`);
        console.log(`GPU detected: ${this.engine.getGlInfo().renderer}`);

        this.starMap = new StarMap(this.engine);
        this.starMap.registerWarpCallback((seed: number) => {
            this.getStarSystem().dispose();
            this.starSystem = new StarSystem(seed, this.getStarSystemScene());
            this.starSystem.generate();
            this.starSystem.init();
            this.collisionWorker.setStarSystem(this.starSystem);
            this.collisionWorker.setPlayer(this.getStarSystemScene().getActiveController());
            positionNearBody(this.getStarSystemScene().getActiveController(), this.getStarSystem().getBodies()[0], this.getStarSystem());
            this.toggleStarMap();
        });

        this.starSystemScene = new UberScene(this.engine);
        this.starSystemScene.clearColor = new Color4(0, 0, 0, 0);

        this.activeScene = this.starSystemScene;

        await Assets.Init(this.starSystemScene);

        this.starSystemScene.executeWhenReady(() => {
            this.getEngine().loadingScreen.hideLoadingUI();
            this.getEngine().runRenderLoop(() => this.getActiveScene().render());
        });

        window.addEventListener("resize", () => {
            this.bodyEditor.resize();
            this.getEngine().resize();
        });

        this.bodyEditor.resize();
    }

    public init() {
        if (this.starSystem === null) throw new Error("Star system is null");
        this.starSystem.init();
        this.collisionWorker.setStarSystem(this.starSystem);
        this.collisionWorker.setPlayer(this.getStarSystemScene().getActiveController());

        this.getStarSystemScene().registerBeforeRender(() => {
            const starSystemScene = this.getStarSystemScene();
            const starSystem = this.getStarSystem();
            const activeController = starSystemScene.getActiveController();

            const deltaTime = this.getEngine().getDeltaTime() / 1000;

            const nearest = starSystem.getNearestBody(starSystemScene.getActiveUberCamera().position);

            this.bodyEditor.update(nearest, starSystem.postProcessManager, starSystemScene);
            this.helmetOverlay.update(nearest);
            this.helmetOverlay.setVisibility(this.bodyEditor.getVisibility() !== EditorVisibility.FULL);

            this.getStarSystem().translateAllBodiesNow(activeController.update(deltaTime));

            if (!this.collisionWorker.isBusy() && isOrbiting(activeController, nearest)) {
                if (nearest instanceof TelluricPlanemo) this.collisionWorker.checkCollision(nearest);
            }

            //FIXME: should address stars orbits
            for (const star of starSystem.stellarObjects) star.descriptor.orbitalProperties.period = 0;

            Assets.ChunkForge.update();
            starSystem.update(deltaTime * Settings.TIME_MULTIPLIER);
        });
    }

    public setActiveController(controller: AbstractController) {
        this.getStarSystemScene().setActiveController(controller);
    }

    public setStarSystem(starSystem: StarSystem) {
        this.starSystem = starSystem;
    }

    public getStarSystem() {
        if (this.starSystem === null) throw new Error("Star system is null");
        return this.starSystem;
    }

    public registerUpdateCallback(callback: () => void) {
        this.getStarSystemScene().registerBeforeRender(callback);
    }

    public getStarSystemScene() {
        if (this.starSystemScene === null) throw new Error("Star system scene is null");
        return this.starSystemScene;
    }

    public getActiveScene(): Scene {
        if (this.activeScene === null) throw new Error("Active scene is null");
        return this.activeScene;
    }

    public getEngine() {
        if (this.engine === null) throw new Error("Engine is null");
        return this.engine;
    }
}
