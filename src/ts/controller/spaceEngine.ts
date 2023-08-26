import { HelmetOverlay } from "../ui/helmetOverlay";
import { BodyEditor, EditorVisibility } from "../ui/bodyEditor/bodyEditor";
import { Assets } from "./assets";
import { AbstractController } from "./uberCore/abstractController";
import { UberScene } from "./uberCore/uberScene";
import { StarSystem } from "./starSystem";
import { TelluricPlanemo } from "../view/bodies/planemos/telluricPlanemo";
import { Settings } from "../settings";
import { OverlayPostProcess } from "../view/postProcesses/overlayPostProcess";
import { isOrbiting } from "../utils/nearestBody";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Tools } from "@babylonjs/core/Misc/tools";
import { VideoRecorder } from "@babylonjs/core/Misc/videoRecorder";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/core/Misc/screenshotTools";
import { StarMap } from "../starmap/starMap";
import { Scene, ScenePerformancePriority } from "@babylonjs/core/scene";
import { positionNearObject } from "../utils/positionNearObject";

import "@babylonjs/core/Physics/physicsEngineComponent";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";

import "@babylonjs/core/Engines/WebGPU/Extensions/";
import { SystemUI } from "../ui/systemUI";
import { BlackHole } from "../view/bodies/stellarObjects/blackHole";
import { ShipController } from "../spaceship/shipController";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { setMaxLinVel } from "../utils/havok";
import { Animation } from "@babylonjs/core/Animations/animation";
import { Observable } from "@babylonjs/core/Misc/observable";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

enum EngineState {
    RUNNING,
    PAUSED
}

export class SpaceEngine {
    // UI
    private readonly helmetOverlay: HelmetOverlay;
    readonly bodyEditor: BodyEditor;
    readonly canvas: HTMLCanvasElement;
    private isFullscreen = false;
    private videoRecorder: VideoRecorder | null = null;

    // BabylonJS
    private engine: Engine | null = null;
    private starSystemScene: UberScene | null = null;

    private havokPlugin: HavokPlugin | null = null;

    private starSystemUI: SystemUI | null = null;

    private starSystem: StarSystem | null = null;
    private starMap: StarMap | null = null;

    private activeScene: Scene | null = null;

    private state = EngineState.RUNNING;

    private static readonly unZoomAnimation = new Animation("unZoom", "radius", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    readonly onToggleStarMapObservable = new Observable<boolean>();

    constructor() {
        this.helmetOverlay = new HelmetOverlay();
        this.bodyEditor = new BodyEditor();

        this.canvas = document.getElementById("renderer") as HTMLCanvasElement;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.bodyEditor.setCanvas(this.canvas);

        SpaceEngine.unZoomAnimation.setKeys([
            {
                frame: 0,
                value: 30
            },
            {
                frame: 30,
                value: 600
            }
        ]);

        //TODO: use the keyboard class
        document.addEventListener("keydown", (e) => {
            if (e.key === "o") OverlayPostProcess.ARE_ENABLED = !OverlayPostProcess.ARE_ENABLED;
            if (e.key === "p") Tools.CreateScreenshot(this.getEngine(), this.getStarSystemScene().getActiveController().getActiveCamera(), { precision: 4 });
            if (e.key === "v") {
                if (!VideoRecorder.IsSupported(this.getEngine())) console.warn("Your browser does not support video recording!");
                if (this.videoRecorder === null) {
                    this.videoRecorder = new VideoRecorder(this.getEngine(), {
                        fps: 60,
                        recordChunckSize: 3000000,
                        mimeType: "video/webm;codecs=h264"
                    });
                    this.videoRecorder.startRecording("planetEngine.webm", Number(prompt("Enter video duration in seconds", "10")));
                } else if (this.videoRecorder.isRecording) {
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

            if (e.key === "t") {
                if (this.getActiveScene() === this.starSystemScene) {
                    if (this.bodyEditor.getVisibility() === EditorVisibility.NAVBAR && this.helmetOverlay.isVisible()) {
                        this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
                        this.helmetOverlay.setVisibility(false);
                    } else if (this.bodyEditor.getVisibility() === EditorVisibility.HIDDEN && !this.helmetOverlay.isVisible()) {
                        this.bodyEditor.setVisibility(EditorVisibility.NAVBAR);
                        this.helmetOverlay.setVisibility(true);
                    }
                }
            }

            // when pressing f11, the ui is hidden when the browser is in fullscreen mode
            if (e.key === "F11") this.isFullscreen = !this.isFullscreen;
        });
    }

    pause(): void {
        this.state = EngineState.PAUSED;
    }

    resume(): void {
        this.state = EngineState.RUNNING;
    }

    /**
     * Toggles the star map
     * @throws Error if the star map is null
     */
    public toggleStarMap(): void {
        if (this.activeScene === this.getStarSystemScene()) {

            this.getStarSystemScene().getActiveController().getActiveCamera().animations = [SpaceEngine.unZoomAnimation];
            this.getStarSystemScene().beginAnimation(this.getStarSystemScene().getActiveController().getActiveCamera(), 0, 60, false, 2.0, () => {
                this.getStarSystemScene().getActiveController().getActiveCamera().animations = [];
                this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
                this.helmetOverlay.setVisibility(false);

                const starMap = this.getStarMap();
                this.activeScene = starMap.scene;
                starMap.focusOnCurrentSystem();
            });
        } else {
            this.activeScene = this.getStarSystemScene();
            this.helmetOverlay.setVisibility(true);
            this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
        }

        this.onToggleStarMapObservable.notifyObservers(this.activeScene === this.getStarMap().scene);
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

        const havokInstance = await HavokPhysics();

        this.starMap = new StarMap(this.engine);
        this.starMap.registerWarpCallback((seed: number) => {
            this.setStarSystem(new StarSystem(seed, this.getStarSystemScene()), true);
            this.init();
            const firstBody = this.getStarSystem().getBodies()[0];
            if (firstBody === undefined) throw new Error("No bodies in star system");
            const activeController = this.getStarSystemScene().getActiveController();
            positionNearObject(activeController, firstBody, this.getStarSystem(), firstBody instanceof BlackHole ? 7 : 5);
            if (activeController instanceof ShipController) activeController.enableWarpDrive();
            this.toggleStarMap();
        });

        this.starSystemScene = new UberScene(this.engine, ScenePerformancePriority.Intermediate);
        this.starSystemScene.clearColor = new Color4(0, 0, 0, 0);
        this.starSystemScene.useRightHandedSystem = true;

        const ambientLight = new HemisphericLight("ambientLight", Vector3.Zero(), this.starSystemScene);
        ambientLight.intensity = 0.3;

        this.starSystemUI = new SystemUI(this.starSystemScene);

        this.havokPlugin = new HavokPlugin(true, havokInstance);
        this.starSystemScene.enablePhysics(Vector3.Zero(), this.havokPlugin);

        setMaxLinVel(this.havokPlugin, 10000, 10000);

        await Assets.Init(this.starSystemScene);

        this.starSystemScene.executeWhenReady(() => {
            this.getEngine().loadingScreen.hideLoadingUI();
            this.getEngine().runRenderLoop(() => this.getActiveScene().render());
        });

        this.starSystemScene.registerBeforeRender(() => {
            if (this.state === EngineState.PAUSED) return;

            const starSystemScene = this.getStarSystemScene();
            const starSystem = this.getStarSystem();

            const deltaTime = this.getEngine().getDeltaTime() / 1000;

            const nearestBody = starSystem.getNearestBody(starSystemScene.getActiveUberCamera().position);

            this.bodyEditor.update(nearestBody, starSystem.postProcessManager, starSystemScene);
            this.helmetOverlay.update(nearestBody);

            //FIXME: should address stars orbits
            for (const star of starSystem.stellarObjects) star.model.orbitalProperties.period = 0;

            Assets.ChunkForge.update();
            starSystem.update(deltaTime * Settings.TIME_MULTIPLIER);
        });

        window.addEventListener("resize", () => {
            this.bodyEditor.resize();
            this.getEngine().resize(true);
        });

        this.bodyEditor.resize();

        this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
        this.helmetOverlay.setVisibility(false);

        this.activeScene = this.starMap.scene;
    }

    /**
     * Inits the current star system
     */
    public init(): void {
        this.getStarSystem().init();
    }

    /**
     * Sets the active controller of the star system scene
     * @param controller the controller to be set as active
     */
    public setActiveController(controller: AbstractController): void {
        this.getStarSystemScene().setActiveController(controller);
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

    public getStarMap(): StarMap {
        if (this.starMap === null) throw new Error("Star map is null");
        return this.starMap;
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

    public getHavokPlugin(): HavokPlugin {
        if (this.havokPlugin === null) throw new Error("Havok plugin is null");
        return this.havokPlugin;
    }
}
