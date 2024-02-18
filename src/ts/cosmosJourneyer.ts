//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import projectInfo from "../../package.json";

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
import { PauseMenu } from "./ui/pauseMenu";
import { StarSystemView } from "./starSystem/starSystemView";
import { EngineFactory } from "@babylonjs/core/Engines/engineFactory";
import { MainMenu } from "./mainMenu/mainMenu";
import { SystemSeed } from "./utils/systemSeed";
import { SaveFileData } from "./saveFile/saveFileData";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { setRotationQuaternion } from "./uberCore/transforms/basicTransform";
import { ShipControls } from "./spaceship/shipControls";
import { encodeBase64 } from "./utils/base64";
import { UniverseCoordinates } from "./saveFile/universeCoordinates";
import { updateInputDevices } from "./inputs/devices";
import { Assets } from "./assets";


enum EngineState {
    UNINITIALIZED,
    RUNNING,
    PAUSED
}

/**
 * Main class of CosmosJourneyer. It handles the underlying BabylonJS engine, and the communication between
 * the starmap view and the star system view. It also provides utility methods to take screenshots and record videos.
 * It also handles the pause menu.
 */
export class CosmosJourneyer {
    readonly engine: Engine;

    readonly starSystemView: StarSystemView;
    readonly starMap: StarMap;

    readonly mainMenu: MainMenu;
    readonly pauseMenu: PauseMenu;

    private activeScene: Scene;

    private state = EngineState.UNINITIALIZED;

    private videoRecorder: VideoRecorder | null = null;

    private constructor(engine: Engine, starSystemView: StarSystemView, starMap: StarMap) {
        this.engine = engine;

        this.starSystemView = starSystemView;
        this.starMap = starMap;
        this.starMap.onWarpObservable.add((seed: SystemSeed) => {
            this.starSystemView.setStarSystem(new StarSystemController(seed, this.starSystemView.scene), true);
            this.starSystemView.initStarSystem();
            this.toggleStarMap();

            const activeControls = this.starSystemView.scene.getActiveController();
            if (activeControls instanceof ShipControls) {
                activeControls.spaceship.enableWarpDrive();
                activeControls.thirdPersonCamera.radius = 30;
            }
        });

        // Init the active scene
        this.starMap.scene.detachControl();
        this.starSystemView.scene.attachControl();
        this.activeScene = this.starSystemView.scene;

        this.mainMenu = new MainMenu(starSystemView);
        this.mainMenu.onStartObservable.add(() => {
            this.starMap.setCurrentStarSystem(this.starSystemView.getStarSystem().model.seed);
            this.starSystemView.switchToSpaceshipControls();
            this.starSystemView.getSpaceshipControls().spaceship.enableWarpDrive();
            this.starSystemView.showUI();
            this.starSystemView.ui.setEnabled(true);
        });

        this.mainMenu.onLoadSaveObservable.add((saveData: SaveFileData) => {
            this.loadSaveData(saveData);
        });

        this.pauseMenu = new PauseMenu();
        this.pauseMenu.onResume.add(() => this.resume());
        this.pauseMenu.onScreenshot.add(() => this.takeScreenshot());
        this.pauseMenu.onShare.add(() => {
            const saveData = this.generateSaveData();

            const urlData = encodeBase64(JSON.stringify(saveData.universeCoordinates));

            const payload = `universeCoordinates=${urlData}`;
            const url = new URL(`https://barthpaleologue.github.io/CosmosJourneyer/?${payload}`);
            navigator.clipboard.writeText(url.toString()).then(() => console.log("Copied to clipboard"));
        });
        this.pauseMenu.onSave.add(() => this.downloadSaveFile());

        window.addEventListener("blur", () => {
            if (!this.mainMenu?.isVisible()) this.pause();
        });

        window.addEventListener("mouseleave", () => {
            if (!this.mainMenu?.isVisible()) this.pause();
        });

        //TODO: use the keyboard class
        document.addEventListener("keydown", (e) => {
            if (this.mainMenu?.isVisible()) return;
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
    public static async CreateAsync(): Promise<CosmosJourneyer> {
        const canvas = document.getElementById("renderer") as HTMLCanvasElement;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Init BabylonJS engine (use webgpu if ?webgpu is in the url)
        const engine = window.location.search.includes("webgpu")
            ? await EngineFactory.CreateAsync(canvas, {
                  twgslOptions: {
                      wasmPath: new URL("./utils/TWGSL/twgsl.wasm", import.meta.url).href,
                      jsPath: new URL("./utils/TWGSL/twgsl.js", import.meta.url).href
                  }
              })
            : new Engine(canvas, true, {
                  // the preserveDrawingBuffer option is required for the screenshot feature to work
                  preserveDrawingBuffer: true
              });

        engine.useReverseDepthBuffer = true;
        engine.loadingScreen.displayLoadingUI();
        window.addEventListener("resize", () => {
            engine.resize(true);
        });

        // Log informations about the gpu and the api used
        console.log(`API: ${engine.isWebGPU ? "WebGPU" : "WebGL" + engine.version}`);
        console.log(`GPU detected: ${engine.getGlInfo().renderer}`);

        // Init Havok physics engine
        const havokInstance = await HavokPhysics();
        console.log(`Havok initialized`);

        // Init starmap view
        const starMap = new StarMap(engine);

        // Init star system view
        const starSystemView = new StarSystemView(engine, havokInstance);

        await starSystemView.initAssets();

        return new CosmosJourneyer(engine, starSystemView, starMap);
    }

    public pause(): void {
        this.state = EngineState.PAUSED;

        if(this.activeScene === this.starSystemView.scene) this.starSystemView.stopBackgroundSounds();

        Assets.OPEN_PAUSE_MENU_SOUND.play();
        this.pauseMenu.setVisibility(true);
    }

    public resume(): void {
        this.state = EngineState.RUNNING;
        Assets.MENU_SELECT_SOUND.play();
        this.pauseMenu.setVisibility(false);
    }

    public isPaused(): boolean {
        return this.state === EngineState.PAUSED;
    }

    /**
     * Inits the current star system
     */
    public init(skipMainMenu = false): void {
        if (!skipMainMenu) this.mainMenu.init();
        this.starSystemView.initStarSystem();

        this.engine.runRenderLoop(() => {
            updateInputDevices();

            if (this.isPaused()) return;
            this.getActiveScene().render();
        });
        this.state = EngineState.RUNNING;
    }

    /**
     * Toggles the star map
     */
    public toggleStarMap(): void {
        if (this.activeScene === this.starSystemView.scene) {
            this.starSystemView.unZoom(() => {
                this.starSystemView.stopBackgroundSounds();
                this.starMap.startBackgroundMusic();

                this.activeScene.detachControl();
                this.starMap.scene.attachControl();
                const starMap = this.starMap;
                this.activeScene = starMap.scene;
                starMap.focusOnCurrentSystem();
            });
        } else {
            this.starMap.stopBackgroundMusic();
            this.activeScene.detachControl();
            this.starSystemView.scene.attachControl();
            this.activeScene = this.starSystemView.scene;
            this.starSystemView.showUI();
        }
    }

    /**
     * Returns the active scene (star system or star map)
     * @returns the active scene (star system or star map)
     */
    public getActiveScene(): Scene {
        return this.activeScene;
    }

    /**
     * Takes a screenshot of the current scene. By default, the screenshot is taken at a 4x the resolution of the canvas
     * @param precision The resolution multiplier of the screenshot
     */
    public takeScreenshot(precision = 4): void {
        const camera = this.getActiveScene().activeCamera;
        if (camera === null) throw new Error("Cannot take screenshot: camera is null");
        Tools.CreateScreenshot(this.engine, camera, { precision: precision });
    }

    public takeVideoCapture(): void {
        if (!VideoRecorder.IsSupported(this.engine)) {
            console.warn("Your browser does not support video recording!");
            return;
        }

        if (this.videoRecorder === null) {
            this.videoRecorder = new VideoRecorder(this.engine, {
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

    /**
     * Generates a save file data object from the current star system and the player's position
     */
    public generateSaveData(): SaveFileData {
        const currentStarSystem = this.starSystemView.getStarSystem();
        const seed = currentStarSystem.model.seed;

        // Finding the index of the nearest orbital object
        const nearestOrbitalObject = currentStarSystem.getNearestOrbitalObject();
        const nearestOrbitalObjectIndex = currentStarSystem.getOrbitalObjects().indexOf(nearestOrbitalObject);
        if (nearestOrbitalObjectIndex === -1) throw new Error("Nearest orbital object not found");

        // Finding the position of the player in the nearest orbital object's frame of reference
        const currentWorldPosition = this.starSystemView.scene.getActiveController().getTransform().getAbsolutePosition();
        const nearestOrbitalObjectInverseWorld = nearestOrbitalObject.getTransform().getWorldMatrix().clone().invert();
        const currentLocalPosition = Vector3.TransformCoordinates(currentWorldPosition, nearestOrbitalObjectInverseWorld);

        // Finding the rotation of the player in the nearest orbital object's frame of reference
        const currentWorldRotation = this.starSystemView.scene.getActiveController().getTransform().absoluteRotationQuaternion;
        const nearestOrbitalObjectInverseRotation = nearestOrbitalObject.getTransform().absoluteRotationQuaternion.clone().invert();
        const currentLocalRotation = currentWorldRotation.multiply(nearestOrbitalObjectInverseRotation);

        return {
            version: projectInfo.version,
            universeCoordinates: {
                starSystem: seed.serialize(),
                nearestOrbitalObjectIndex: nearestOrbitalObjectIndex,
                positionX: currentLocalPosition.x,
                positionY: currentLocalPosition.y,
                positionZ: currentLocalPosition.z,
                rotationQuaternionX: currentLocalRotation.x,
                rotationQuaternionY: currentLocalRotation.y,
                rotationQuaternionZ: currentLocalRotation.z,
                rotationQuaternionW: currentLocalRotation.w
            }
        };
    }

    /**
     * Generates save file data and downloads it as a json file
     */
    public downloadSaveFile(): void {
        const saveData = this.generateSaveData();
        const blob = new Blob([JSON.stringify(saveData)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "save.json";
        link.click();
    }

    /**
     * Loads a save file and apply it. This will generate the requested star system and position the player at the requested position around the requested orbital object.
     * This will perform engine initialization if the engine is not initialized.
     * @param saveData The save file data to load
     */
    public loadSaveData(saveData: SaveFileData): void {
        this.loadUniverseCoordinates(saveData.universeCoordinates);
    }

    /**
     * Loads universe coordinates and apply them. This will generate the requested star system and position the player at the requested position around the requested orbital object.
     * This will perform engine initialization if the engine is not initialized.
     * @param universeCoordinates The universe coordinates to load
     */
    public loadUniverseCoordinates(universeCoordinates: UniverseCoordinates): void {
        const seed = SystemSeed.Deserialize(universeCoordinates.starSystem);

        this.starMap.setCurrentStarSystem(seed);
        this.starSystemView.setStarSystem(new StarSystemController(seed, this.starSystemView.scene), true);

        this.starSystemView.onInitStarSystem.addOnce(() => {
            this.starSystemView.switchToSpaceshipControls();

            this.starSystemView.ui.setEnabled(true);
            this.starSystemView.showUI();

            const playerTransform = this.starSystemView.scene.getActiveController().getTransform();

            const nearestOrbitalObject = this.starSystemView.getStarSystem().getOrbitalObjects()[universeCoordinates.nearestOrbitalObjectIndex];
            const nearestOrbitalObjectWorld = nearestOrbitalObject.getTransform().getWorldMatrix();
            const currentLocalPosition = new Vector3(universeCoordinates.positionX, universeCoordinates.positionY, universeCoordinates.positionZ);
            const currentWorldPosition = Vector3.TransformCoordinates(currentLocalPosition, nearestOrbitalObjectWorld);
            playerTransform.setAbsolutePosition(currentWorldPosition);

            const nearestOrbitalObjectWorldRotation = nearestOrbitalObject.getTransform().absoluteRotationQuaternion;
            const currentLocalRotationQuaternion = new Quaternion(
                universeCoordinates.rotationQuaternionX,
                universeCoordinates.rotationQuaternionY,
                universeCoordinates.rotationQuaternionZ,
                universeCoordinates.rotationQuaternionW
            );
            const currentWorldRotationQuaternion = currentLocalRotationQuaternion.multiply(nearestOrbitalObjectWorldRotation);
            setRotationQuaternion(playerTransform, currentWorldRotationQuaternion);

            // updates camera position
            this.starSystemView.getSpaceshipControls().getActiveCamera().getViewMatrix(true);

            // re-centers the star system
            this.starSystemView.getStarSystem().applyFloatingOrigin();
        });

        if (this.state === EngineState.UNINITIALIZED) this.init(true);
        else this.starSystemView.initStarSystem();
    }
}
