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
import { VideoRecorder } from "@babylonjs/core/Misc/videoRecorder";
import { EngineFactory } from "@babylonjs/core/Engines/engineFactory";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/core/Misc/screenshotTools";
import { StarMap } from "./starmap/starMap";
import { Scene } from "@babylonjs/core/scene";
import { positionNearObject } from "./utils/positionNearObject";

import "@babylonjs/core/Physics/physicsEngineComponent";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";

import "@babylonjs/core/Engines/WebGPU/Extensions/";

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

    private videoRecorder: VideoRecorder | null = null;

    private readonly collisionWorker = new CollisionWorker();

    private isFullscreen = false;

    constructor() {
        this.helmetOverlay = new HelmetOverlay();
        this.bodyEditor = new BodyEditor();

        this.canvas = document.getElementById("renderer") as HTMLCanvasElement;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.bodyEditor.setCanvas(this.canvas);

        //TODO: use the keyboard class
        document.addEventListener("keydown", (e) => {
            if (e.key === "o") OverlayPostProcess.ARE_ENABLED = !OverlayPostProcess.ARE_ENABLED;
            if (e.key === "p") Tools.CreateScreenshot(this.getEngine(), this.getStarSystemScene().getActiveController().getActiveCamera(), { precision: 4 });
            if (e.key === "v") {
                if(!VideoRecorder.IsSupported(this.getEngine())) console.warn("Your browser does not support video recording!");
                if (this.videoRecorder === null) {
                    this.videoRecorder = new VideoRecorder(this.getEngine(), {
                        fps: 60,
                        recordChunckSize: 3000000,
                        mimeType: "video/webm;codecs=h264",
                    });
                    this.videoRecorder.startRecording("planetEngine.webm", Number(prompt("Enter video duration in seconds", "10")));
                } else if(this.videoRecorder.isRecording) {
                    this.videoRecorder.stopRecording();
                } else {
                    this.videoRecorder.startRecording("planetEngine.webm", Number(prompt("Enter video duration in seconds", "10")));
                }
            }
            if (e.key === "u") this.bodyEditor.setVisibility(this.bodyEditor.getVisibility() === EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
            //if (e.key === "m") mouse.deadAreaRadius === 50 ? (mouse.deadAreaRadius = 1e5) : (mouse.deadAreaRadius = 50);
            //if (e.key === "w" && isOrbiting(this.getStarSystemScene().getActiveController(), this.getStarSystem().getNearestBody()))
            //    (this.getStarSystem().getNearestBody() as TelluricPlanemo).material.wireframe = !(this.getStarSystem().getNearestBody() as TelluricPlanemo).material.wireframe;

            if (e.key === "m") this.toggleStarMap();

            // when pressing f11, the ui is hidden when the browser is in fullscreen mode
            if (e.key === "F11") this.isFullscreen = !this.isFullscreen;
        });
    }

    /**
     * Toggles the star map
     * @throws Error if the star map is null
     */
    public toggleStarMap(): void {
        if (this.activeScene === this.getStarSystemScene()) {
            if (this.starMap === null) throw new Error("Star map is null");
            this.activeScene = this.starMap.scene;
            this.helmetOverlay.setVisibility(false);
            this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
        } else {
            this.activeScene = this.getStarSystemScene();
            this.helmetOverlay.setVisibility(true);
            this.bodyEditor.setVisibility(EditorVisibility.NAVBAR);
        }
    }

    /**
     * Creates the engine and the scenes and loads the assets async
     * @returns A promise that resolves when the engine and the scenes are created and the assets are loaded
     */
    public async setup(): Promise<void> {
        this.engine = new Engine(this.canvas); //await EngineFactory.CreateAsync(this.canvas, { enableAllFeatures: true });
        
        this.engine.loadingScreen.displayLoadingUI();

        console.log(`API: ${this.engine instanceof WebGPUEngine ? "WebGPU" : "WebGL" + this.engine.webGLVersion}`);
        console.log(`GPU detected: ${this.engine.getGlInfo().renderer}`);

        this.starMap = new StarMap(this.engine);
        this.starMap.registerWarpCallback((seed: number) => {
            this.setStarSystem(new StarSystem(seed, this.getStarSystemScene()), true);
            this.init();
            positionNearObject(this.getStarSystemScene().getActiveController(), this.getStarSystem().getBodies()[0], this.getStarSystem());
            this.toggleStarMap();
        });

        this.starSystemScene = new UberScene(this.engine);
        this.starSystemScene.clearColor = new Color4(0, 0, 0, 0);

        const havokInstance = await HavokPhysics();
        const havokPlugin = new HavokPlugin(true, havokInstance);
        this.starSystemScene.enablePhysics(null, havokPlugin);

        this.activeScene = this.starSystemScene;

        await Assets.Init(this.starSystemScene);

        this.starSystemScene.executeWhenReady(() => {
            this.getEngine().loadingScreen.hideLoadingUI();
            this.getEngine().runRenderLoop(() => this.getActiveScene().render());
        });

        this.starSystemScene.registerBeforeRender(() => {
            const starSystemScene = this.getStarSystemScene();
            const starSystem = this.getStarSystem();
            const activeController = starSystemScene.getActiveController();

            const deltaTime = this.getEngine().getDeltaTime() / 1000;

            const nearestBody = starSystem.getNearestBody(starSystemScene.getActiveUberCamera().position);

            this.bodyEditor.update(nearestBody, starSystem.postProcessManager, starSystemScene);
            this.helmetOverlay.update(nearestBody);
            this.helmetOverlay.setVisibility(!this.isFullscreen && this.bodyEditor.getVisibility() !== EditorVisibility.FULL);

            this.getStarSystem().translateEverythingNow(activeController.update(deltaTime));

            if (!this.collisionWorker.isBusy() && isOrbiting(activeController, nearestBody)) {
                if (nearestBody instanceof TelluricPlanemo) this.collisionWorker.checkCollision(nearestBody);
            }

            //FIXME: should address stars orbits
            for (const star of starSystem.stellarObjects) star.descriptor.orbitalProperties.period = 0;

            Assets.ChunkForge.update();
            starSystem.update(deltaTime * Settings.TIME_MULTIPLIER);
        });

        window.addEventListener("resize", () => {
            this.bodyEditor.resize();
            this.getEngine().resize(true);
        });

        this.bodyEditor.resize();
    }

    /**
     * Inits the current star system and the collision worker
     */
    public init(): void {
        this.getStarSystem().init();
        this.collisionWorker.setStarSystem(this.getStarSystem());
        this.collisionWorker.setPlayer(this.getStarSystemScene().getActiveController());
    }

    /**
     * Sets the active controller of the star system scene
     * @param controller the controller to be set as active
     */
    public setActiveController(controller: AbstractController): void {
        this.getStarSystemScene().setActiveController(controller);
        this.collisionWorker.setPlayer(controller);
    }

    /**
     * Sets the star system and generates it if needed and disposes the old one. Does not perform the init method
     * @param starSystem the star system to be set
     * @param needsGenerating whether the star system needs to be generated or not
     */
    public setStarSystem(starSystem: StarSystem, needsGenerating: boolean): void {
        this.starSystem?.dispose();
        this.starSystem = starSystem;
        if (needsGenerating) this.starSystem.generate();
    }

    /**
     * Returns the star system
     * @returns the star system
     * @throws Error if the star system is null
     */
    public getStarSystem(): StarSystem {
        if (this.starSystem === null) throw new Error("Star system is null");
        return this.starSystem;
    }

    /**
     * Registers a callback to be called before the star system scene is rendered
     * @param callback the callback to be called before the star system scene is rendered
     */
    public registerStarSystemUpdateCallback(callback: () => void): void {
        this.getStarSystemScene().registerBeforeRender(callback);
    }

    /**
     * Returns the star system scene
     * @returns the star system scene
     * @throws Error if the star system scene is null
     */
    public getStarSystemScene(): UberScene {
        if (this.starSystemScene === null) throw new Error("Star system scene is null");
        return this.starSystemScene;
    }

    /**
     * Returns the active scene (star system or star map)
     * @returns the active scene (star system or star map)
     * @throws Error if the active scene is null
     */
    public getActiveScene(): Scene {
        if (this.activeScene === null) throw new Error("Active scene is null");
        return this.activeScene;
    }

    /**
     * Returns the BabylonJS engine
     * @returns the BabylonJS engine
     * @throws Error if the engine is null
     */
    public getEngine(): Engine {
        if (this.engine === null) throw new Error("Engine is null");
        return this.engine;
    }
}
