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

import { Engine } from "@babylonjs/core/Engines/engine";
import { Tools } from "@babylonjs/core/Misc/tools";
import { VideoRecorder } from "@babylonjs/core/Misc/videoRecorder";
import "@babylonjs/core/Misc/screenshotTools";
import { StarMap } from "./starmap/starMap";

import "@babylonjs/core/Physics/physicsEngineComponent";
import HavokPhysics from "@babylonjs/havok";

import "@babylonjs/core/Engines/WebGPU/Extensions/";
import { PauseMenu } from "./ui/pauseMenu";
import { StarSystemView } from "./starSystem/starSystemView";
import { EngineFactory } from "@babylonjs/core/Engines/engineFactory";
import { MainMenu } from "./ui/mainMenu";
import { getSavesFromLocalStorage, SaveFileData, writeSavesToLocalStorage } from "./saveFile/saveFileData";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { setRotationQuaternion } from "./uberCore/transforms/basicTransform";
import { encodeBase64 } from "./utils/base64";
import { StarSystemCoordinates, UniverseCoordinates } from "./utils/coordinates/universeCoordinates";
import { View } from "./utils/view";
import { updateInputDevices } from "./inputs/devices";
import { AudioManager } from "./audio/audioManager";
import { AudioMasks } from "./audio/audioMasks";
import { GeneralInputs } from "./inputs/generalInputs";
import { createNotification, NotificationIntent, NotificationOrigin, updateNotifications } from "./utils/notification";
import { LoadingScreen } from "./uberCore/loadingScreen";
import i18n, { initI18n } from "./i18n";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Sounds } from "./assets/sounds";
import { TutorialLayer } from "./ui/tutorial/tutorialLayer";
import { FlightTutorial } from "./tutorials/flightTutorial";
import { SidePanels } from "./ui/sidePanels";
import { Settings } from "./settings";
import { Player } from "./player/player";
import { getObjectBySystemId, getUniverseObjectId } from "./utils/coordinates/orbitalObjectId";
import { Tutorial } from "./tutorials/tutorial";
import { StationLandingTutorial } from "./tutorials/stationLandingTutorial";
import { promptModalBoolean, alertModal, promptModalString } from "./utils/dialogModal";
import { FuelScoopTutorial } from "./tutorials/fuelScoopTutorial";
import { EncyclopaediaGalacticaManager } from "./society/encyclopaediaGalacticaManager";
import { EncyclopaediaGalacticaLocal } from "./society/encyclopaediaGalacticaLocal";
import { StarSystemDatabase } from "./starSystem/starSystemDatabase";
import { registerCustomSystems } from "./starSystem/customSystems/registerCustomSystems";

const enum EngineState {
    UNINITIALIZED,
    RUNNING,
    PAUSED
}

// register cosmos journeyer as part of window object
declare global {
    interface Window {
        CosmosJourneyer: CosmosJourneyer;
    }
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

    readonly player: Player;

    readonly encyclopaedia: EncyclopaediaGalacticaManager;

    readonly starSystemDatabase: StarSystemDatabase;

    /**
     * The number of seconds elapsed since the start of the engine
     */
    private elapsedSeconds = 0;

    /**
     * The period of time in seconds between each autosave
     */
    private readonly autoSavePeriodSeconds = 60 * 5;

    private autoSaveTimerSeconds = 0;

    private isAutoSaveEnabled = true;

    private constructor(
        player: Player,
        engine: AbstractEngine,
        starSystemView: StarSystemView,
        encyclopaedia: EncyclopaediaGalacticaManager,
        starSystemDatabase: StarSystemDatabase
    ) {
        this.engine = engine;

        this.player = player;
        this.player.onNameChangedObservable.add((newName) => {
            // when name changes, rewrite the name in all saves
            const saves = getSavesFromLocalStorage();
            const cmdrSaves = saves[this.player.uuid];

            if (cmdrSaves === undefined) return;

            cmdrSaves.manual.forEach((save) => (save.player.name = newName));
            cmdrSaves.auto.forEach((save) => (save.player.name = newName));

            writeSavesToLocalStorage(saves);
        });

        this.starSystemDatabase = starSystemDatabase;

        this.encyclopaedia = encyclopaedia;
        this.player.discoveries.uploaded.forEach((discovery) => {
            this.encyclopaedia.contributeDiscoveryIfNew(discovery);
        });

        this.starSystemView = starSystemView;
        this.starSystemView.onBeforeJump.add(() => {
            // in case something goes wrong during the jump, we want to save the player's progress
            this.createAutoSave();
        });
        this.starSystemView.onAfterJump.add(async () => {
            // always save the player's progress after a jump
            this.createAutoSave();

            if (!this.player.tutorials.fuelScoopingCompleted) {
                await this.tutorialLayer.setTutorial(FuelScoopTutorial);
                this.tutorialLayer.onQuitTutorial.addOnce(() => {
                    this.player.tutorials.fuelScoopingCompleted = true;
                });
            }
        });
        this.starSystemView.onNewDiscovery.add(() => {
            this.createAutoSave();
        });

        // Init starmap view
        this.starMap = new StarMap(this.player, this.engine, this.encyclopaedia, this.starSystemDatabase);
        this.starMap.onTargetSetObservable.add((systemCoordinates: StarSystemCoordinates) => {
            this.starSystemView.setSystemAsTarget(systemCoordinates);
        });

        // Init the active scene
        this.starMap.detachControl();
        this.starSystemView.attachControl();
        this.activeView = this.starSystemView;
        AudioManager.SetMask(AudioMasks.STAR_SYSTEM_VIEW);

        this.tutorialLayer = new TutorialLayer();

        this.sidePanels = new SidePanels(this.starSystemDatabase);
        this.sidePanels.loadSavePanelContent.onLoadSaveObservable.add(async (saveData: SaveFileData) => {
            engine.onEndFrameObservable.addOnce(async () => {
                if (this.isPaused()) {
                    this.createAutoSave(); // from the pause menu, create autosave of the current game before loading a save
                }
                this.resume();
                this.starSystemView.setUIEnabled(true);
                await this.loadSave(saveData);
            });
        });

        this.mainMenu = new MainMenu(this.sidePanels, this.starSystemView, this.starSystemDatabase);
        this.mainMenu.onStartObservable.add(async () => {
            await this.tutorialLayer.setTutorial(FlightTutorial);
            this.starSystemView.switchToSpaceshipControls();
            const spaceshipPosition = this.starSystemView.getSpaceshipControls().getTransform().getAbsolutePosition();
            const closestSpaceStation = this.starSystemView
                .getStarSystem()
                .getOrbitalFacilities()
                .reduce((closest, current) => {
                    const currentDistance = Vector3.DistanceSquared(spaceshipPosition, current.getTransform().getAbsolutePosition());
                    const closestDistance = Vector3.DistanceSquared(spaceshipPosition, closest.getTransform().getAbsolutePosition());
                    return currentDistance < closestDistance ? current : closest;
                });
            this.starSystemView.setTarget(closestSpaceStation);
            this.createAutoSave();
        });

        this.sidePanels.tutorialsPanelContent.onTutorialSelected.add(async (tutorial) => {
            if (!this.mainMenu.isVisible()) {
                // if the main menu is not visible, then we are in game and we need to ask the player if they want to leave their game
                this.createAutoSave();
                const shouldLoadTutorial = await promptModalBoolean(i18n.t("tutorials:common:loadTutorialWillLeaveGame"));
                if (!shouldLoadTutorial) return;
            }
            this.sidePanels.hideActivePanel();
            await this.loadTutorial(tutorial);
        });

        this.starSystemView.getSpaceshipControls().onToggleWarpDrive.add(async (isWarpDriveEnabled) => {
            if (isWarpDriveEnabled) return;
            if (this.starSystemView.getSpaceshipControls().getClosestLandableFacility() === null) return;
            if (this.player.tutorials.stationLandingCompleted) return;
            await this.tutorialLayer.setTutorial(StationLandingTutorial);
            this.tutorialLayer.onQuitTutorial.addOnce(() => {
                this.player.tutorials.stationLandingCompleted = true;
            });
        });

        this.starSystemView.getSpaceshipControls().onCompleteLanding.add(() => {
            this.createAutoSave();
        });

        this.starSystemView.onInitStarSystem.add(() => {
            const starSystemModel = this.starSystemView.getStarSystem().model;
            this.starMap.setCurrentStarSystem(starSystemModel.coordinates);
        });

        this.pauseMenu = new PauseMenu(this.sidePanels);
        this.pauseMenu.onResume.add(() => this.resume());
        this.pauseMenu.onScreenshot.add(() => this.takeScreenshot());
        this.pauseMenu.onShare.add(() => {
            this.engine.onEndFrameObservable.addOnce(() => {
                const saveData = this.generateSaveData();

                const urlRoot = window.location.href.split("?")[0];
                const urlData = encodeBase64(JSON.stringify(saveData.universeCoordinates));
                const url = new URL(`${urlRoot}?universeCoordinates=${urlData}`);
                navigator.clipboard.writeText(url.toString()).then(() => {
                    createNotification(NotificationOrigin.GENERAL, NotificationIntent.INFO, i18n.t("notifications:copiedToClipboard"), 2000);
                });
            });
        });
        this.pauseMenu.onSave.add(async () => {
            const saveSuccess = await this.saveToLocalStorage();
            if (saveSuccess) createNotification(NotificationOrigin.GENERAL, NotificationIntent.SUCCESS, i18n.t("notifications:saveOk"), 2000);
            else createNotification(NotificationOrigin.GENERAL, NotificationIntent.ERROR, i18n.t("notifications:cantSaveTutorial"), 2000);
        });

        window.addEventListener("blur", () => {
            if (!this.mainMenu?.isVisible() && !this.starSystemView.isLoadingSystem()) this.pause();
        });

        window.addEventListener("mouseleave", () => {
            if (!this.mainMenu?.isVisible() && !this.starSystemView.isLoadingSystem()) this.pause();
        });

        window.addEventListener("resize", () => {
            this.engine.resize(true);
        });

        window.addEventListener("beforeunload", () => {
            if (this.mainMenu.isVisible()) return; // don't autosave if the main menu is visible: the player is not in the game yet
            this.createAutoSave();
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

        window.CosmosJourneyer = this;
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
                  preserveDrawingBuffer: true,
                  useHighPrecisionMatrix: true,
                  doNotHandleContextLost: true
              });

        engine.useReverseDepthBuffer = true;
        engine.loadingScreen = new LoadingScreen(canvas);
        engine.loadingScreen.displayLoadingUI();
        window.addEventListener("resize", () => {
            engine.resize(true);
        });

        await initI18n();

        // Log informations about the gpu and the api used
        console.log(`API: ${engine.isWebGPU ? "WebGPU" : "WebGL" + engine.version}`);
        console.log(`GPU detected: ${engine.extractDriverInfo()}`);

        // Init Havok physics engine
        const havokInstance = await HavokPhysics();
        console.log(`Havok initialized`);

        const starSystemDatabase = new StarSystemDatabase();
        registerCustomSystems(starSystemDatabase);

        const player = Player.Default();

        const encyclopaedia = new EncyclopaediaGalacticaManager();
        encyclopaedia.backends.push(new EncyclopaediaGalacticaLocal(starSystemDatabase));

        // Init star system view
        const starSystemView = new StarSystemView(player, engine, havokInstance, encyclopaedia, starSystemDatabase);

        await starSystemView.initAssets();
        starSystemView.resetPlayer();

        if (!navigator.keyboard) {
            await alertModal("Your keyboard layout could not be detected. The QWERTY layout will be assumed by default.");
        }

        return new CosmosJourneyer(player, engine, starSystemView, encyclopaedia, starSystemDatabase);
    }

    public pause(): void {
        if (this.isPaused()) return;
        if (this.mainMenu.isVisible()) return;
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
            const deltaSeconds = this.engine.getDeltaTime() / 1000;
            this.elapsedSeconds += deltaSeconds;

            this.player.timePlayedSeconds += deltaSeconds;

            (this.engine.loadingScreen as LoadingScreen).setProgressPercentage(this.starSystemView.getStarSystem().getLoadingProgress() * 100);

            this.autoSaveTimerSeconds += deltaSeconds;
            if (this.autoSaveTimerSeconds >= this.autoSavePeriodSeconds) {
                this.autoSaveTimerSeconds %= this.autoSavePeriodSeconds;

                if (!this.mainMenu.isVisible() && !this.starSystemView.isJumpingBetweenSystems()) {
                    // don't autosave if the main menu is visible: the player is not in the game yet
                    // don't autosave when jumping between systems
                    this.createAutoSave();
                }
            }

            updateInputDevices();
            updateNotifications(deltaSeconds);
            AudioManager.Update(deltaSeconds);
            Sounds.Update();

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
            AudioManager.SetMask(AudioMasks.STAR_MAP_VIEW);

            this.starSystemView.targetCursorLayer.setEnabled(false);

            this.starSystemView.detachControl();
            this.starMap.attachControl();

            const starMap = this.starMap;
            this.activeView = starMap;
            starMap.focusOnCurrentSystem();
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

        const spaceShipControls = this.starSystemView.getSpaceshipControls();

        const spaceship = spaceShipControls.getSpaceship();

        // Finding the index of the nearest orbital object
        const nearestOrbitalObject = currentStarSystem.getNearestOrbitalObject(spaceShipControls.getTransform().getAbsolutePosition());
        const nearestOrbitalObjectIndex = currentStarSystem.getOrbitalObjects().indexOf(nearestOrbitalObject);
        if (nearestOrbitalObjectIndex === -1) throw new Error("Nearest orbital object not found");

        // Finding the position of the player in the nearest orbital object's frame of reference
        const currentWorldPosition = spaceShipControls.getTransform().getAbsolutePosition();
        const nearestOrbitalObjectInverseWorld = nearestOrbitalObject.getTransform().computeWorldMatrix(true).clone().invert();
        const currentLocalPosition = Vector3.TransformCoordinates(currentWorldPosition, nearestOrbitalObjectInverseWorld);
        const distanceToNearestOrbitalObject = currentLocalPosition.length();
        if (distanceToNearestOrbitalObject < nearestOrbitalObject.getBoundingRadius() * 1.1) {
            currentLocalPosition.scaleInPlace((nearestOrbitalObject.getBoundingRadius() * 1.1) / distanceToNearestOrbitalObject);
        }

        // Finding the rotation of the player in the nearest orbital object's frame of reference
        const currentWorldRotation = spaceShipControls.getTransform().absoluteRotationQuaternion;
        const nearestOrbitalObjectInverseRotation = nearestOrbitalObject.getTransform().absoluteRotationQuaternion.clone().invert();
        const currentLocalRotation = currentWorldRotation.multiply(nearestOrbitalObjectInverseRotation);

        const universeObjectId = getUniverseObjectId(nearestOrbitalObject, currentStarSystem);

        return {
            version: projectInfo.version,
            timestamp: Date.now(),
            player: Player.Serialize(this.player),
            universeCoordinates: {
                universeObjectId: universeObjectId,
                positionX: currentLocalPosition.x,
                positionY: currentLocalPosition.y,
                positionZ: currentLocalPosition.z,
                rotationQuaternionX: currentLocalRotation.x,
                rotationQuaternionY: currentLocalRotation.y,
                rotationQuaternionZ: currentLocalRotation.z,
                rotationQuaternionW: currentLocalRotation.w
            },
            padNumber: spaceship.isLandedAtFacility() ? spaceship.getTargetLandingPad()?.padNumber : undefined
        };
    }

    public async saveToLocalStorage(): Promise<boolean> {
        if (this.player.uuid === Settings.TUTORIAL_SAVE_UUID) return false; // don't save in tutorial
        if (this.player.uuid === Settings.SHARED_POSITION_SAVE_UUID) {
            this.player.uuid = crypto.randomUUID();
            this.player.setName((await promptModalString(i18n.t("spaceStation:cmdrNameChangePrompt"), this.player.getName())) ?? "Python");
        }

        const saveData = this.generateSaveData();

        // use player uuid as key to avoid overwriting other cmdr's save
        const uuid = saveData.player.uuid;

        // store in a hashmap in local storage
        const saves = getSavesFromLocalStorage();
        saves[uuid] = saves[uuid] || { manual: [], auto: [] };
        saves[uuid].manual.unshift(saveData);

        writeSavesToLocalStorage(saves);

        return true;
    }

    public setAutoSaveEnabled(isEnabled: boolean): void {
        this.isAutoSaveEnabled = isEnabled;
    }

    /**
     * Generate save file data and store it in the autosaves hashmap in local storage
     */
    public createAutoSave(): void {
        if (!this.isAutoSaveEnabled) return;

        const saveData = this.generateSaveData();

        // use player uuid as key to avoid overwriting other cmdr's autosave
        const uuid = saveData.player.uuid;

        if (uuid === Settings.SHARED_POSITION_SAVE_UUID) return; // don't autosave shared position
        if (uuid === Settings.TUTORIAL_SAVE_UUID) return; // don't autosave in tutorial

        // store in a hashmap in local storage
        const saves = getSavesFromLocalStorage();
        saves[uuid] = saves[uuid] || { manual: [], auto: [] };
        saves[uuid].auto.unshift(saveData); // enqueue the new autosave
        while (saves[uuid].auto.length > Settings.MAX_AUTO_SAVES) {
            saves[uuid].auto.pop(); // dequeue the oldest autosave
        }
        writeSavesToLocalStorage(saves);

        this.autoSaveTimerSeconds = 0;
    }

    /**
     * Generates save file data and downloads it as a json file
     */
    public downloadSaveFile(): void {
        this.engine.onEndFrameObservable.addOnce(() => {
            const saveData = this.generateSaveData();
            const blob = new Blob([JSON.stringify(saveData)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const dateString = new Date().toLocaleString().replace(/[^0-9a-zA-Z]/g, "_"); // avoid special characters in the filename
            link.download = `CMDR_${this.player.getName()}_${dateString}.json`;
            link.click();
        });
    }

    public async loadTutorial(tutorial: Tutorial) {
        this.engine.onEndFrameObservable.addOnce(async () => {
            this.mainMenu.hide();
            await this.loadSave(tutorial.saveData);
            this.player.uuid = Settings.TUTORIAL_SAVE_UUID;
            this.resume();
            await this.tutorialLayer.setTutorial(tutorial);
            this.starSystemView.setUIEnabled(true);

            const targetObject = getObjectBySystemId(tutorial.saveData.universeCoordinates.universeObjectId, this.starSystemView.getStarSystem());
            if (targetObject === null) {
                throw new Error("Could not find the target object of the tutorial even though it should be in the star system");
            }
            this.starSystemView.getSpaceshipControls().getTransform().lookAt(targetObject.getTransform().getAbsolutePosition());
        });
    }

    /**
     * Loads a save file and apply it. This will generate the requested star system and position the player at the requested position around the requested orbital object.
     * This will perform engine initialization if the engine is not initialized.
     * @param saveData The save file data to load
     */
    public async loadSave(saveData: SaveFileData): Promise<void> {
        if (saveData.version !== projectInfo.version) {
            createNotification(
                NotificationOrigin.GENERAL,
                NotificationIntent.WARNING,
                i18n.t("notifications:saveVersionMismatch", {
                    currentVersion: projectInfo.version,
                    saveVersion: saveData.version
                }),
                60_000
            );
        }

        const newPlayer = saveData.player !== undefined ? Player.Deserialize(saveData.player) : Player.Default();
        this.player.copyFrom(newPlayer);
        this.player.discoveries.uploaded.forEach((discovery) => {
            this.encyclopaedia.contributeDiscoveryIfNew(discovery);
        });
        this.starSystemView.resetPlayer();

        await this.loadUniverseCoordinates(saveData.universeCoordinates);

        if (saveData.padNumber !== undefined) {
            const padNumber = saveData.padNumber;

            const shipPosition = this.starSystemView.getSpaceshipControls().getTransform().getAbsolutePosition();

            const nearestOrbitalObject = this.starSystemView.getStarSystem().getNearestOrbitalObject(shipPosition);
            const correspondingSpaceStation = this.starSystemView
                .getStarSystem()
                .getOrbitalFacilities()
                .find((station) => station === nearestOrbitalObject);
            if (correspondingSpaceStation === undefined) {
                throw new Error("Tried loading a save with a pad number, but the closest orbital objects does not have landing pads!");
            }

            const landingPad = correspondingSpaceStation.getLandingPads().at(padNumber);
            if (landingPad === undefined) {
                throw new Error(`Could not find the pad with number ${padNumber} at this station: ${correspondingSpaceStation.model.name}`);
            }

            this.starSystemView.getSpaceshipControls().getSpaceship().spawnOnPad(landingPad);
        }

        if (this.player.currentItinerary.length > 1) {
            this.starSystemView.setSystemAsTarget(this.player.currentItinerary[1]);
        }
    }

    /**
     * Loads universe coordinates and apply them. This will generate the requested star system and position the player at the requested position around the requested orbital object.
     * This will perform engine initialization if the engine is not initialized.
     * @param universeCoordinates The universe coordinates to load
     */
    public async loadUniverseCoordinates(universeCoordinates: UniverseCoordinates): Promise<void> {
        this.engine.loadingScreen.displayLoadingUI();

        const universeObjectId = universeCoordinates.universeObjectId;

        const systemModel = this.starSystemDatabase.getSystemModelFromCoordinates(universeObjectId.starSystemCoordinates);
        await this.starSystemView.loadStarSystem(systemModel);

        if (this.state === EngineState.UNINITIALIZED) await this.init(true);
        else this.starSystemView.initStarSystem();

        this.starSystemView.switchToSpaceshipControls();

        const playerTransform = this.starSystemView.scene.getActiveControls().getTransform();

        const nearestOrbitalObject = getObjectBySystemId(universeObjectId, this.starSystemView.getStarSystem());
        if (nearestOrbitalObject === null) {
            throw new Error(`Could not find the nearest orbital object with index ${universeObjectId.objectIndex} and type ${universeObjectId.objectType}`);
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
        this.starSystemView.getSpaceshipControls().getActiveCamera().getViewMatrix(true);

        // re-centers the star system
        this.starSystemView.getStarSystem().applyFloatingOrigin();

        // set the ui target to the nearest orbital object
        this.starSystemView.targetCursorLayer.setTarget(nearestOrbitalObject);
        this.starSystemView.spaceShipLayer.setTarget(nearestOrbitalObject.getTransform());

        this.engine.loadingScreen.hideLoadingUI();
    }
}
