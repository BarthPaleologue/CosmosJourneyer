//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import projectInfo from "../../package.json";

import { Tools } from "@babylonjs/core/Misc/tools";
import { VideoRecorder } from "@babylonjs/core/Misc/videoRecorder";
import "@babylonjs/core/Misc/screenshotTools";
import { StarMap } from "./starmap/starMap";

import "@babylonjs/core/Physics/physicsEngineComponent";
import HavokPhysics from "@babylonjs/havok";

import "@babylonjs/core/Engines/WebGPU/Extensions/";
import { PauseMenu } from "./ui/pauseMenu";
import { StarSystemView } from "./starSystem/starSystemView";
import { MainMenu } from "./ui/mainMenu";
import { SystemSeed } from "./utils/systemSeed";
import { SaveFileData } from "./saveFile/saveFileData";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { setRotationQuaternion } from "./uberCore/transforms/basicTransform";
import { ShipControls } from "./spaceship/shipControls";
import { encodeBase64 } from "./utils/base64";
import { UniverseCoordinates } from "./saveFile/universeCoordinates";
import { View } from "./utils/view";
import { updateInputDevices } from "./inputs/devices";
import { AudioManager } from "./audio/audioManager";
import { AudioMasks } from "./audio/audioMasks";
import { GeneralInputs } from "./inputs/generalInputs";
import { createNotification } from "./utils/notification";
import { StarSystemInputs } from "./inputs/starSystemInputs";
import { pressInteractionToStrings } from "./utils/inputControlsString";
import { LoadingScreen } from "./uberCore/loadingScreen";
import i18n from "./i18n";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Sounds } from "./assets/sounds";
import { TutorialLayer } from "./ui/tutorial/tutorialLayer";
import { FlightTutorial } from "./tutorials/flightTutorial";
import { SidePanels } from "./ui/sidePanels";
import { Settings } from "./settings";
import { SeededStarSystemModel } from "./starSystem/seededStarSystemModel";
import { CustomStarSystemModel } from "./starSystem/customStarSystemModel";

import * as webllm from "@mlc-ai/web-llm";

const enum EngineState {
    UNINITIALIZED,
    RUNNING,
    PAUSED
}

/**
 * Main class of Cosmos Journeyer. It handles the underlying BabylonJS engine, and the communication between
 * the starmap view and the star system view. It also provides utility methods to take screenshots and record videos.
 * It also handles the pause menu.
 */
export class CosmosJourneyer {
    readonly engine: AbstractEngine;

    readonly starSystemView: StarSystemView;
    readonly starMap: StarMap;

    readonly mainMenu: MainMenu;
    readonly pauseMenu: PauseMenu;
    readonly sidePanels: SidePanels;

    readonly tutorialLayer: TutorialLayer;

    private activeView: View;

    private state = EngineState.UNINITIALIZED;

    private videoRecorder: VideoRecorder | null = null;

    private constructor(engine: AbstractEngine, starSystemView: StarSystemView, starMap: StarMap) {
        this.engine = engine;

        this.starSystemView = starSystemView;
        this.starMap = starMap;
        this.starMap.onTargetSetObservable.add((seed: SystemSeed) => {
            this.starSystemView.setSystemAsTarget(seed);
        });

        // Init the active scene
        this.starMap.detachControl();
        this.starSystemView.attachControl();
        this.activeView = this.starSystemView;
        AudioManager.SetMask(AudioMasks.STAR_SYSTEM_VIEW);

        this.tutorialLayer = new TutorialLayer();

        this.sidePanels = new SidePanels(this.starSystemView);

        this.mainMenu = new MainMenu(this.sidePanels, starSystemView);
        this.mainMenu.onStartObservable.add(() => {
            this.tutorialLayer.setTutorial(FlightTutorial.title, FlightTutorial.getContentPanelsHtml());

            this.starSystemView.switchToSpaceshipControls();
        });

        this.mainMenu.onLoadSaveObservable.add(async (saveData: SaveFileData) => {
            await this.loadSaveData(saveData);
        });

        this.sidePanels.tutorialsPanelContent.onTutorialSelected.add((tutorial) => {
            this.mainMenu.hide();
            this.resume();
            this.tutorialLayer.setTutorial(tutorial.title, tutorial.getContentPanelsHtml());
            this.starSystemView.targetCursorLayer.setEnabled(true);
            this.starSystemView.getSpaceshipControls().spaceship.disableWarpDrive();
            this.starSystemView.getSpaceshipControls().spaceship.setMainEngineThrottle(0);
            Settings.TIME_MULTIPLIER = 1;
        });

        this.starSystemView.onInitStarSystem.add(() => {
            const starSystemModel = this.starSystemView.getStarSystem().model;
            if (starSystemModel instanceof SeededStarSystemModel) {
                this.starMap.setCurrentStarSystem(starSystemModel.seed);
            }
        });

        this.pauseMenu = new PauseMenu(this.sidePanels);
        this.pauseMenu.onResume.add(() => this.resume());
        this.pauseMenu.onScreenshot.add(() => this.takeScreenshot());
        this.pauseMenu.onShare.add(() => {
            const saveData = this.generateSaveData();

            const urlData = encodeBase64(JSON.stringify(saveData.universeCoordinates));

            const payload = `universeCoordinates=${urlData}`;
            const url = new URL(`https://barthpaleologue.github.io/CosmosJourneyer/?${payload}`);
            navigator.clipboard.writeText(url.toString()).then(() => {
                createNotification(i18n.t("notifications:copiedToClipboard"), 2000);
            });
        });
        this.pauseMenu.onSave.add(() => this.downloadSaveFile());

        window.addEventListener("blur", () => {
            if (!this.mainMenu?.isVisible()) this.pause();
        });

        window.addEventListener("mouseleave", () => {
            if (!this.mainMenu?.isVisible()) this.pause();
        });

        window.addEventListener("resize", () => {
            this.engine.resize(true);
        });

        GeneralInputs.map.toggleStarMap.on("complete", () => {
            if (this.mainMenu?.isVisible()) return;
            this.toggleStarMap();
        });

        GeneralInputs.map.screenshot.on("complete", () => {
            if (this.mainMenu?.isVisible()) return;
            this.takeScreenshot();
        });

        GeneralInputs.map.videoCapture.on("complete", () => {
            if (this.mainMenu?.isVisible()) return;
            this.takeVideoCapture();
        });

        GeneralInputs.map.togglePause.on("complete", () => {
            if (this.mainMenu?.isVisible()) return;
            if (!this.isPaused()) this.pause();
            else this.resume();
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

        if (!(await WebGPUEngine.IsSupportedAsync)) {
            alert(
                "WebGPU is not supported in your browser. Please check the compatibility here: https://github.com/gpuweb/gpuweb/wiki/Implementation-Status#implementation-status");
        }

        // Init BabylonJS engine
        const engine = new WebGPUEngine(canvas, {
            antialias: true,
            audioEngine: true,
            useHighPrecisionMatrix: true
        });
        await engine.initAsync(undefined, {
            wasmPath: new URL("./utils/TWGSL/twgsl.wasm", import.meta.url).href,
            jsPath: new URL("./utils/TWGSL/twgsl.js", import.meta.url).href
        });

        engine.useReverseDepthBuffer = true;
        engine.loadingScreen = new LoadingScreen(canvas);
        engine.loadingScreen.displayLoadingUI();
        window.addEventListener("resize", () => {
            engine.resize(true);
        });

        // Log informations about the gpu and the api used
        console.log(`API: ${engine.isWebGPU ? "WebGPU" : "WebGL" + engine.version}`);
        console.log(`GPU detected: ${engine.extractDriverInfo()}`);

        // Init Havok physics engine
        const havokInstance = await HavokPhysics();
        console.log(`Havok initialized`);

        // Init star system view
        const starSystemView = new StarSystemView(engine, havokInstance);

        await starSystemView.initAssets();

        // Init starmap view
        const starMap = new StarMap(engine);

        const selectedModel = "Phi-3.5-mini-instruct-q4f16_1-MLC-1k";
        const initProgressCallback = (report: webllm.InitProgressReport) => {
            console.log(report.text);
          };
        const inferenceEngine: webllm.MLCEngineInterface = await webllm.CreateMLCEngine(
            selectedModel,
            {
            initProgressCallback: initProgressCallback,
            logLevel: "INFO", // specify the log level
            },
            // customize kv cache, use either context_window_size or sliding_window_size (with attention sink)
            undefined,
          );

        const reply0 = await inferenceEngine.chat.completions.create({
        messages: [{ role: "user", content: "Le silence de ces espaces infinis m'effraie" }],
        // below configurations are all optional
        n: 1,
        temperature: 1.5,
        max_tokens: 256,
        logit_bias: null,
        logprobs: true,
        top_logprobs: 2,
        });
        console.log(reply0);
        console.log(reply0.usage);

        return new CosmosJourneyer(engine, starSystemView, starMap);
    }

    public pause(): void {
        if (this.isPaused()) return;
        this.state = EngineState.PAUSED;

        if (this.activeView === this.starSystemView) this.starSystemView.stopBackgroundSounds();

        Sounds.OPEN_PAUSE_MENU_SOUND.play();
        this.pauseMenu.setVisibility(true);
    }

    public resume(): void {
        if (!this.isPaused()) return;
        this.state = EngineState.RUNNING;
        Sounds.MENU_SELECT_SOUND.play();
        this.pauseMenu.setVisibility(false);
    }

    public isPaused(): boolean {
        return this.state === EngineState.PAUSED;
    }

    /**
     * Inits the current star system
     */
    public async init(skipMainMenu = false): Promise<void> {
        if (!skipMainMenu) await this.mainMenu.init();
        this.starSystemView.initStarSystem();

        this.engine.runRenderLoop(() => {
            updateInputDevices();
            AudioManager.Update(this.engine.getDeltaTime() / 1000);

            if (this.isPaused()) return;
            this.activeView.render();
        });
        this.state = EngineState.RUNNING;
    }

    /**
     * Toggles the star map
     */
    public toggleStarMap(): void {
        if (this.activeView === this.starSystemView) {
            this.starSystemView.unZoom(() => {
                AudioManager.SetMask(AudioMasks.STAR_MAP_VIEW);

                this.starSystemView.targetCursorLayer.setEnabled(false);

                this.starSystemView.detachControl();
                this.starMap.attachControl();

                const starMap = this.starMap;
                this.activeView = starMap;
                starMap.focusOnCurrentSystem();
            });
        } else {
            this.starMap.detachControl();
            this.starSystemView.attachControl();

            AudioManager.SetMask(AudioMasks.STAR_SYSTEM_VIEW);
            this.activeView = this.starSystemView;
        }
    }

    /**
     * Takes a screenshot of the current scene. By default, the screenshot is taken at a 4x the resolution of the canvas
     */
    public takeScreenshot(): void {
        const camera = this.activeView.getMainScene().activeCamera;
        if (camera === null) throw new Error("Cannot take screenshot: camera is null");
        Tools.CreateScreenshot(this.engine, camera, { precision: 1 });
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

        if (!(currentStarSystem.model instanceof SeededStarSystemModel)) {
            throw new Error("Cannot save inside a star system that has no generation seed");
        }
        const seed = currentStarSystem.model.seed;

        const spaceShipControls = this.starSystemView.getSpaceshipControls();

        // Finding the index of the nearest orbital object
        const nearestOrbitalObject = currentStarSystem.getNearestOrbitalObject(spaceShipControls.getTransform().getAbsolutePosition());
        const nearestOrbitalObjectIndex = currentStarSystem.getOrbitalObjects().indexOf(nearestOrbitalObject);
        if (nearestOrbitalObjectIndex === -1) throw new Error("Nearest orbital object not found");

        // Finding the position of the player in the nearest orbital object's frame of reference
        const currentWorldPosition = spaceShipControls.getTransform().getAbsolutePosition();
        const nearestOrbitalObjectInverseWorld = nearestOrbitalObject.getTransform().getWorldMatrix().clone().invert();
        const currentLocalPosition = Vector3.TransformCoordinates(currentWorldPosition, nearestOrbitalObjectInverseWorld);

        // Finding the rotation of the player in the nearest orbital object's frame of reference
        const currentWorldRotation = spaceShipControls.getTransform().absoluteRotationQuaternion;
        const nearestOrbitalObjectInverseRotation = nearestOrbitalObject.getTransform().absoluteRotationQuaternion.clone().invert();
        const currentLocalRotation = currentWorldRotation.multiply(nearestOrbitalObjectInverseRotation);

        return {
            version: projectInfo.version,
            universeCoordinates: {
                starSystem: seed.serialize(),
                orbitalObjectIndex: nearestOrbitalObjectIndex,
                positionX: currentLocalPosition.x,
                positionY: currentLocalPosition.y,
                positionZ: currentLocalPosition.z,
                rotationQuaternionX: currentLocalRotation.x,
                rotationQuaternionY: currentLocalRotation.y,
                rotationQuaternionZ: currentLocalRotation.z,
                rotationQuaternionW: currentLocalRotation.w
            },
            padNumber: spaceShipControls.spaceship.isLandedAtFacility() ? spaceShipControls.spaceship.getTargetLandingPad()?.padNumber : undefined
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
    public async loadSaveData(saveData: SaveFileData): Promise<void> {
        await this.loadUniverseCoordinates(saveData.universeCoordinates);

        if (saveData.padNumber !== undefined) {
            const padNumber = saveData.padNumber;

            const shipPosition = this.starSystemView.getSpaceshipControls().getTransform().getAbsolutePosition();

            const nearestOrbitalObject = this.starSystemView.getStarSystem().getNearestOrbitalObject(shipPosition);
            const correspondingSpaceStation = this.starSystemView
                .getStarSystem()
                .getSpaceStations()
                .find((station) => station === nearestOrbitalObject);
            if (correspondingSpaceStation === undefined) {
                throw new Error("Tried loading a save with a pad number, but the closest orbital objects does not have landing pads!");
            }

            const landingPad = correspondingSpaceStation.getLandingPads().at(padNumber);
            if (landingPad === undefined) {
                throw new Error(`Could not find the pad with number ${padNumber} at this station: ${correspondingSpaceStation.model.name}`);
            }

            this.starSystemView.getSpaceshipControls().spaceship.spawnOnPad(landingPad);
        }
    }

    /**
     * Loads universe coordinates and apply them. This will generate the requested star system and position the player at the requested position around the requested orbital object.
     * This will perform engine initialization if the engine is not initialized.
     * @param universeCoordinates The universe coordinates to load
     */
    public async loadUniverseCoordinates(universeCoordinates: UniverseCoordinates): Promise<void> {
        this.engine.loadingScreen.displayLoadingUI();

        const seed = SystemSeed.Deserialize(universeCoordinates.starSystem);

        await this.starSystemView.loadStarSystemFromSeed(seed);

        if (this.state === EngineState.UNINITIALIZED) await this.init(true);
        else this.starSystemView.initStarSystem();

        this.starSystemView.switchToSpaceshipControls();

        const playerTransform = this.starSystemView.scene.getActiveControls().getTransform();

        const nearestOrbitalObject = this.starSystemView.getStarSystem().getOrbitalObjects().at(universeCoordinates.orbitalObjectIndex);
        if (nearestOrbitalObject === undefined) {
            throw new Error(
                `Could not find the nearest orbital object with index ${universeCoordinates.orbitalObjectIndex} among the ${this.starSystemView.getStarSystem().getOrbitalObjects().length} different objects`
            );
        }

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
        this.starSystemView
            .getSpaceshipControls()
            .getActiveCameras()
            .forEach((camera) => camera.getViewMatrix(true));

        // re-centers the star system
        this.starSystemView.getStarSystem().applyFloatingOrigin();

        // set the ui target to the nearest orbital object
        this.starSystemView.targetCursorLayer.setTarget(nearestOrbitalObject);
        this.starSystemView.spaceShipLayer.setTarget(nearestOrbitalObject.getTransform());

        this.engine.loadingScreen.hideLoadingUI();
    }
}
