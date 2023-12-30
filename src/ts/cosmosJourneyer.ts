import { Assets } from "./assets";
import { StarSystemController } from "./starSystem/starSystemController";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Tools } from "@babylonjs/core/Misc/tools";
import { VideoRecorder } from "@babylonjs/core/Misc/videoRecorder";
import "@babylonjs/core/Misc/screenshotTools";
import { StarMap } from "./starmap/starMap";
import { Scene } from "@babylonjs/core/scene";

import "@babylonjs/core/Physics/physicsEngineComponent";
import HavokPhysics from "@babylonjs/havok";

import "@babylonjs/core/Engines/WebGPU/Extensions/";
import { Observable } from "@babylonjs/core/Misc/observable";
import { PauseMenu } from "./ui/pauseMenu";
import { StarSystemView } from "./starSystem/StarSystemView";
import { EngineFactory } from "@babylonjs/core/Engines/engineFactory";
import { MainMenu } from "./mainMenu/mainMenu";

enum EngineState {
    RUNNING,
    PAUSED
}

/**
 * Main class of CosmosJourneyer. It handles the underlying BabylonJS engine, and the communication between
 * the starmap view and the star system view. It also provides utility methods to take screenshots and record videos.
 * It also handles the pause menu.
 */
export class CosmosJourneyer {
    private readonly pauseMenu: PauseMenu;
    private videoRecorder: VideoRecorder | null = null;

    readonly canvas: HTMLCanvasElement;
    private engine: Engine | null = null;

    private mainMenu: MainMenu | null = null;
    private starSystemView: StarSystemView | null = null;
    private starMap: StarMap | null = null;

    private activeScene: Scene | null = null;

    private state = EngineState.RUNNING;

    readonly onToggleStarMapObservable = new Observable<boolean>();

    constructor() {
        this.pauseMenu = new PauseMenu();
        this.pauseMenu.onResume.add(() => this.resume());
        this.pauseMenu.onScreenshot.add(() => this.takeScreenshot());
        this.pauseMenu.onShare.add(() => {
            const seed = this.getStarSystemView().getStarSystem().model.seed;
            const url = new URL(`https://barthpaleologue.github.io/CosmosJourneyer/random.html?seed=${seed}`);
            navigator.clipboard.writeText(url.toString()).then(() => console.log("Copied to clipboard"));
        });

        this.canvas = document.getElementById("renderer") as HTMLCanvasElement;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        window.addEventListener("blur", () => {
            if (!this.isPaused() && this.activeScene !== this.mainMenu?.scene) this.pause();
        });

        //TODO: use the keyboard class
        document.addEventListener("keydown", (e) => {
            if (e.key === "p") this.takeScreenshot();
            if (e.key === "v") this.takeVideoCapture();
            if (e.key === "m") this.toggleStarMap();

            if (e.key === "Escape") {
                if (!this.isPaused()) this.pause();
                else this.resume();
            }
        });
    }

    /**
     * Creates the engine and the scenes and loads the assets async
     * @returns A promise that resolves when the engine and the scenes are created and the assets are loaded
     */
    public async setup(): Promise<void> {
        // Init BabylonJS engine (use webgpu if ?webgpu is in the url)
        this.engine = window.location.search.includes("webgpu")
            ? await EngineFactory.CreateAsync(this.canvas, {
                  twgslOptions: {
                      wasmPath: new URL("./utils/TWGSL/twgsl.wasm", import.meta.url).href,
                      jsPath: new URL("./utils/TWGSL/twgsl.js", import.meta.url).href
                  }
              })
            : new Engine(this.canvas);

        //this.engine = new Engine(this.canvas); //await EngineFactory.CreateAsync(this.canvas, { enableAllFeatures: true });
        this.engine.useReverseDepthBuffer = true;
        this.engine.loadingScreen.displayLoadingUI();
        window.addEventListener("resize", () => {
            this.getEngine().resize(true);
        });

        // Log informations about the gpu and the api used
        console.log(`API: ${this.engine.isWebGPU ? "WebGPU" : "WebGL" + this.engine.webGLVersion}`);
        console.log(`GPU detected: ${this.engine.getGlInfo().renderer}`);

        // Init Havok physics engine
        const havokInstance = await HavokPhysics();
        console.log(`Havok initialized`);

        this.mainMenu = new MainMenu(this.engine, havokInstance);

        // Init starmap view
        this.starMap = new StarMap(this.engine);
        this.starMap.onWarpObservable.add((seed: number) => {
            this.getStarSystemView().setStarSystem(new StarSystemController(seed, this.getStarSystemView().scene), true);
            this.getStarSystemView().init();
            this.toggleStarMap();
        });

        // Init star system view
        this.starSystemView = new StarSystemView(this.engine, havokInstance);

        // Init assets used in star system view
        await Assets.Init(this.getStarSystemView().scene);

        // Starmap is the active scene by default
        this.activeScene = this.mainMenu.scene;
    }

    public pause(): void {
        this.state = EngineState.PAUSED;
        this.pauseMenu.setVisibility(true);
    }

    public resume(): void {
        this.state = EngineState.RUNNING;
        this.pauseMenu.setVisibility(false);
    }

    public isPaused(): boolean {
        return this.state === EngineState.PAUSED;
    }

    /**
     * Inits the current star system
     */
    public init(): void {
        this.getMainMenu().init();
        this.getStarSystemView().init();

        this.getEngine().runRenderLoop(() => {
            if (this.isPaused()) return;
            this.getActiveScene().render();
        });
    }

    /**
     * Registers a callback to be called before the star system scene is rendered
     * @param callback the callback to be called before the star system scene is rendered
     */
    public registerStarSystemUpdateCallback(callback: () => void): void {
        this.getStarSystemView().scene.onBeforeRenderObservable.add(callback);
    }

    public getMainMenu(): MainMenu {
        if (this.mainMenu === null) throw new Error("Main menu is null");
        return this.mainMenu;
    }

    public getStarSystemView(): StarSystemView {
        if (this.starSystemView === null) throw new Error("Star system view is null");
        return this.starSystemView;
    }

    public getStarMap(): StarMap {
        if (this.starMap === null) throw new Error("Star map is null");
        return this.starMap;
    }

    /**
     * Toggles the star map
     * @throws Error if the star map is null
     */
    public toggleStarMap(): void {
        if (this.activeScene === this.getStarSystemView().scene) {
            this.getStarSystemView().unZoom(() => {
                this.getStarSystemView().scene.detachControl();
                this.getStarMap().scene.attachControl();
                const starMap = this.getStarMap();
                this.activeScene = starMap.scene;
                starMap.focusOnCurrentSystem();
            });
        } else {
            this.getStarMap().scene.detachControl();
            this.getStarSystemView().scene.attachControl();
            this.activeScene = this.getStarSystemView().scene;
            this.getStarSystemView().showUI();
        }

        this.onToggleStarMapObservable.notifyObservers(this.activeScene === this.getStarMap().scene);
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

    /**
     * Takes a screenshot of the current scene. By default, the screenshot is taken at a 4x the resolution of the canvas
     * @param precision The resolution multiplier of the screenshot
     */
    public takeScreenshot(precision = 4): void {
        const camera = this.getActiveScene().activeCamera;
        if (camera === null) throw new Error("Cannot take screenshot: camera is null");
        Tools.CreateScreenshot(this.getEngine(), camera, { precision: precision });
    }

    public takeVideoCapture(): void {
        if (!VideoRecorder.IsSupported(this.getEngine())) {
            console.warn("Your browser does not support video recording!");
            return;
        }

        if (this.videoRecorder === null) {
            this.videoRecorder = new VideoRecorder(this.getEngine(), {
                fps: 60,
                recordChunckSize: 3000000,
                mimeType: "video/webm;codecs=h264"
            });
        }

        if (this.videoRecorder.isRecording) {
            this.videoRecorder.stopRecording();
        } else {
            this.videoRecorder.startRecording("planetEngine.webm", Number(prompt("Enter video duration in seconds", "10"))).then();
        }
    }
}
