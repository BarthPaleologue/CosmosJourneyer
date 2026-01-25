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

import "@babylonjs/core/Misc/screenshotTools";
import "@babylonjs/core/Physics/physicsEngineComponent";
import "@babylonjs/core/Engines/WebGPU/Extensions/";
import "@babylonjs/core/Engines/Extensions/";

import type { AudioEngineV2 } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import { CreateAudioEngineAsync } from "@babylonjs/core/AudioV2/webAudio/webAudioEngine";
import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Engine } from "@babylonjs/core/Engines/engine";
import { EngineFactory } from "@babylonjs/core/Engines/engineFactory";
import { Quaternion } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { type TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Tools } from "@babylonjs/core/Misc/tools";
import { VideoRecorder } from "@babylonjs/core/Misc/videoRecorder";
import type { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { Scene } from "@babylonjs/core/scene";
import HavokPhysics from "@babylonjs/havok";

import type { ICosmosJourneyerBackend } from "@/backend";
import { CosmosJourneyerBackendLocal } from "@/backend/backendLocal";
import { createUrlFromSave, type Save } from "@/backend/save/saveFileData";
import {
    type AtStationCoordinates,
    type RelativeCoordinates,
    type UniverseCoordinates,
} from "@/backend/save/universeCoordinates";
import { type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { getUniverseObjectId } from "@/backend/universe/universeObjectId";

import { loadAssets, type Assets } from "@/frontend/assets/assets";
import { AudioMasks } from "@/frontend/audio/audioMasks";
import { MusicConductor } from "@/frontend/audio/musicConductor";
import { SoundPlayer, SoundPlayerMock, SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { Tts } from "@/frontend/audio/tts";
import { LoadingScreen } from "@/frontend/helpers/loadingScreen";
import { positionNearObject } from "@/frontend/helpers/positionNearObject";
import { UberScene } from "@/frontend/helpers/uberScene";
import { GeneralInputs } from "@/frontend/inputs/generalInputs";
import { Player } from "@/frontend/player/player";
import { StarMapView } from "@/frontend/starmap/starMapView";
import { StarSystemView } from "@/frontend/starSystemView";
import { alertModal, promptModalBoolean, promptModalString } from "@/frontend/ui/dialogModal";
import { MainMenu } from "@/frontend/ui/mainMenu";
import { NotificationIntent, NotificationOrigin } from "@/frontend/ui/notification";
import { PauseMenu } from "@/frontend/ui/pauseMenu";
import { SidePanels } from "@/frontend/ui/sidePanels";
import { TutorialLayer } from "@/frontend/ui/tutorial/tutorialLayer";
import { type View } from "@/frontend/view";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";
import type { DeepReadonly } from "@/utils/types";

import i18n, { initI18n } from "@/i18n";
import { Settings } from "@/settings";

import { LoadingProgressMonitor } from "./assets/loadingProgressMonitor";
import { loadStarMapTextures } from "./assets/textures/starMap";
import { lookAt } from "./helpers/transform";
import { NotificationManager, type INotificationManager } from "./ui/notificationManager";
import { FlightTutorial } from "./ui/tutorial/tutorials/flightTutorial";
import { FuelScoopTutorial } from "./ui/tutorial/tutorials/fuelScoopTutorial";
import { StarMapTutorial } from "./ui/tutorial/tutorials/starMapTutorial";
import { StationLandingTutorial } from "./ui/tutorial/tutorials/stationLandingTutorial";
import { type Tutorial } from "./ui/tutorial/tutorials/tutorial";

const enum EngineState {
    UNINITIALIZED,
    RUNNING,
    PAUSED,
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

    readonly assets: Assets;

    readonly starSystemView: StarSystemView;
    readonly starMap: StarMapView;

    readonly musicConductor: MusicConductor;
    readonly soundPlayer: ISoundPlayer;
    readonly tts: Tts;
    readonly notificationManager: INotificationManager;

    readonly mainMenu: MainMenu;
    readonly pauseMenu: PauseMenu;
    readonly sidePanels: SidePanels;

    readonly tutorialLayer: TutorialLayer;

    private activeView: View;

    private state = EngineState.UNINITIALIZED;

    private videoRecorder: VideoRecorder | null = null;

    readonly player: Player;

    readonly backend: ICosmosJourneyerBackend;

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
        audioEngine: AudioEngineV2,
        assets: Assets,
        starSystemView: StarSystemView,
        starMapView: StarMapView,
        backend: ICosmosJourneyerBackend,
        soundPlayer: ISoundPlayer,
        tts: Tts,
        notificationManager: INotificationManager,
    ) {
        this.engine = engine;

        this.assets = assets;

        this.player = player;

        this.backend = backend;

        this.player.discoveries.uploaded.forEach(async (discovery) => {
            await this.backend.encyclopaedia.contributeDiscoveryIfNew(discovery);
        });

        this.starSystemView = starSystemView;
        this.starSystemView.onBeforeJump.add(async () => {
            // in case something goes wrong during the jump, we want to save the player's progress
            await this.createAutoSave();
        });
        this.starSystemView.onAfterJump.add(async () => {
            // always save the player's progress after a jump
            await this.createAutoSave();

            if (!this.player.tutorials.fuelScoopingCompleted) {
                await this.tutorialLayer.setTutorial(new FuelScoopTutorial());
                this.tutorialLayer.onQuitTutorial.addOnce(() => {
                    this.player.tutorials.fuelScoopingCompleted = true;
                });
            }
        });
        this.starSystemView.onNewDiscovery.add(async () => {
            await this.createAutoSave();
        });

        this.musicConductor = new MusicConductor(this.assets.audio.musics, audioEngine, this.starSystemView);
        this.soundPlayer = soundPlayer;
        this.tts = tts;
        this.notificationManager = notificationManager;

        this.starMap = starMapView;
        this.starMap.onTargetSetObservable.add((systemCoordinates: StarSystemCoordinates) => {
            this.starSystemView.setSystemAsTarget(systemCoordinates);
        });

        // Init the active scene
        this.starMap.detachControl();
        this.starSystemView.attachControl();
        this.activeView = this.starSystemView;
        soundPlayer.setInstanceMask(AudioMasks.STAR_SYSTEM_VIEW);

        this.tutorialLayer = new TutorialLayer(this.soundPlayer);
        document.body.appendChild(this.tutorialLayer.root);

        this.sidePanels = new SidePanels(
            this.backend.universe,
            this.backend.save,
            this.soundPlayer,
            this.musicConductor,
            this.notificationManager,
        );
        this.sidePanels.loadSavePanel.content.onLoadSaveObservable.add((saveData: DeepReadonly<Save>) => {
            engine.onEndFrameObservable.addOnce(async () => {
                if (this.isPaused()) {
                    await this.createAutoSave(); // from the pause menu, create autosave of the current game before loading a save
                }
                await this.resume();
                this.starSystemView.setUIEnabled(true);
                await this.loadSave(saveData);
            });
        });

        this.mainMenu = new MainMenu(
            this.sidePanels,
            this.starSystemView,
            this.backend.save,
            this.backend.universe,
            this.soundPlayer,
        );
        this.mainMenu.onStartObservable.add(async () => {
            await this.tutorialLayer.setTutorial(new FlightTutorial());
            this.tutorialLayer.onQuitTutorial.addOnce(() => {
                this.player.tutorials.flightCompleted = true;
            });
            await this.starSystemView.switchToSpaceshipControls();
            const spaceshipPosition = this.starSystemView.getSpaceshipControls().getTransform().getAbsolutePosition();
            const closestSpaceStation = this.starSystemView
                .getStarSystem()
                .getOrbitalFacilities()
                .reduce((closest, current) => {
                    const currentDistance = Vector3.DistanceSquared(
                        spaceshipPosition,
                        current.getTransform().getAbsolutePosition(),
                    );
                    const closestDistance = Vector3.DistanceSquared(
                        spaceshipPosition,
                        closest.getTransform().getAbsolutePosition(),
                    );
                    return currentDistance < closestDistance ? current : closest;
                });
            this.starSystemView.setTarget(closestSpaceStation);
            await this.createAutoSave();
        });

        this.sidePanels.tutorialsPanel.content.onTutorialSelected.add(async (tutorial) => {
            if (!this.mainMenu.isVisible()) {
                // if the main menu is not visible, then we are in game and we need to ask the player if they want to leave their game
                await this.createAutoSave();
                const shouldLoadTutorial = await promptModalBoolean(
                    i18n.t("tutorials:common:loadTutorialWillLeaveGame"),
                    this.soundPlayer,
                );
                if (!shouldLoadTutorial) return;
            }
            this.sidePanels.hideActivePanel();
            this.loadTutorial(tutorial);
        });

        this.starSystemView.getSpaceshipControls().onToggleWarpDrive.add(async (isWarpDriveEnabled) => {
            if (isWarpDriveEnabled) return;
            if (this.player.tutorials.stationLandingCompleted) return;

            const shipControls = this.starSystemView.getSpaceshipControls();
            const closestLandableFacility = shipControls.getClosestLandableFacility();
            if (closestLandableFacility === null) return;

            const shipPosition = shipControls.getTransform().getAbsolutePosition();
            const facilityPosition = closestLandableFacility.getTransform().position;
            const limitDistance = 10 * closestLandableFacility.getBoundingRadius();
            if (Vector3.DistanceSquared(shipPosition, facilityPosition) > limitDistance ** 2) return;

            await this.tutorialLayer.setTutorial(new StationLandingTutorial());
            this.tutorialLayer.onQuitTutorial.addOnce(() => {
                this.player.tutorials.stationLandingCompleted = true;
            });
        });

        this.starSystemView.getSpaceshipControls().onCompleteLanding.add(async () => {
            await this.createAutoSave();
        });

        this.starSystemView.onInitStarSystem.add(() => {
            const starSystemModel = this.starSystemView.getStarSystem().model;
            this.starMap.setCurrentStarSystem(starSystemModel.coordinates, false);
        });

        this.starSystemView.spaceStationLayer.onTakeOffObservable.add(async () => {
            if (this.player.tutorials.starMapCompleted) {
                return;
            }

            await this.tutorialLayer.setTutorial(new StarMapTutorial());
            this.tutorialLayer.onQuitTutorial.addOnce(() => {
                this.player.tutorials.starMapCompleted = true;
            });
        });

        this.pauseMenu = new PauseMenu(this.sidePanels, this.soundPlayer);
        this.pauseMenu.onResume.add(() => this.resume());
        this.pauseMenu.onScreenshot.add(() => this.takeScreenshot());
        this.pauseMenu.onShare.add(() => {
            this.engine.onEndFrameObservable.addOnce(async () => {
                const save = await this.generateSaveData();
                save.player.uuid = Settings.SHARED_POSITION_SAVE_UUID;
                const url = createUrlFromSave(save);
                if (url === null) {
                    await alertModal("Could not create a shareable link.", this.soundPlayer);
                    return;
                }

                await navigator.clipboard.writeText(url.toString()).then(() => {
                    this.notificationManager.create(
                        NotificationOrigin.GENERAL,
                        NotificationIntent.INFO,
                        i18n.t("notifications:copiedToClipboard"),
                        2000,
                    );
                });
            });
        });
        this.pauseMenu.onSave.add(async () => {
            const saveSuccess = await this.createManualSave();
            if (saveSuccess)
                this.notificationManager.create(
                    NotificationOrigin.GENERAL,
                    NotificationIntent.SUCCESS,
                    i18n.t("notifications:saveOk"),
                    2000,
                );
            else
                this.notificationManager.create(
                    NotificationOrigin.GENERAL,
                    NotificationIntent.ERROR,
                    i18n.t("notifications:cantSaveTutorial"),
                    2000,
                );
        });

        window.addEventListener("blur", () => {
            if (!this.mainMenu.isVisible() && !this.starSystemView.isLoadingSystem()) this.pause();
        });

        window.addEventListener("mouseleave", () => {
            if (!this.mainMenu.isVisible() && !this.starSystemView.isLoadingSystem()) this.pause();
        });

        window.addEventListener("resize", () => {
            this.engine.resize(true);
        });

        window.addEventListener("beforeunload", async () => {
            if (this.mainMenu.isVisible()) return; // don't autosave if the main menu is visible: the player is not in the game yet
            await this.createAutoSave();
        });

        GeneralInputs.map.toggleStarMap.on("complete", async () => {
            if (this.mainMenu.isVisible()) return;
            await this.toggleStarMap();
        });

        GeneralInputs.map.screenshot.on("complete", async () => {
            if (this.mainMenu.isVisible()) return;
            await this.takeScreenshot();
        });

        GeneralInputs.map.videoCapture.on("complete", async () => {
            if (this.mainMenu.isVisible()) return;
            await this.takeVideoCapture();
        });

        GeneralInputs.map.togglePause.on("complete", () => {
            if (this.mainMenu.isVisible()) return;
            if (!this.isPaused()) this.pause();
        });

        window.CosmosJourneyer = this;
    }

    /**
     * Creates the engine and the scenes and loads the assets async
     * @returns A promise that resolves when the engine and the scenes are created and the assets are loaded
     */
    public static async CreateAsync(): Promise<CosmosJourneyer> {
        const canvas = document.createElement("canvas");
        document.body.prepend(canvas);

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const loadingScreen = new LoadingScreen(canvas);

        const backendResult = await CosmosJourneyerBackendLocal.New();
        if (!backendResult.success) {
            await alertModal(backendResult.error.message, new SoundPlayerMock());
            throw backendResult.error;
        }

        const backend = backendResult.value;

        // Init BabylonJS engine (use webgpu if ?webgpu is in the url)
        const engine = window.location.search.includes("webgpu")
            ? await EngineFactory.CreateAsync(canvas, {
                  twgslOptions: {
                      wasmPath: new URL("@/utils/TWGSL/twgsl.wasm", import.meta.url).href,
                      jsPath: new URL("@/utils/TWGSL/twgsl.js", import.meta.url).href,
                  },
              })
            : new Engine(canvas, true, {
                  // the preserveDrawingBuffer option is required for the screenshot feature to work
                  preserveDrawingBuffer: true,
                  useHighPrecisionMatrix: true,
                  doNotHandleContextLost: true,
              });

        engine.useReverseDepthBuffer = true;
        engine.loadingScreen = loadingScreen;
        engine.loadingScreen.displayLoadingUI();
        window.addEventListener("resize", () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            engine.resize(true);
        });

        const audioEngine = await CreateAudioEngineAsync();

        await initI18n();

        // Log informations about the gpu and the api used
        console.log(`API: ${engine.isWebGPU ? "WebGPU" : "WebGL"}`);
        console.log(`GPU detected: ${engine.extractDriverInfo()}`);

        // Init Havok physics engine
        const havokInstance = await HavokPhysics();
        console.log(`Havok initialized`);

        const player = Player.Default(backend.universe);

        const starSystemViewScene = new UberScene(engine, { useFloatingOrigin: true });
        starSystemViewScene.useRightHandedSystem = true;

        const starMapScene = new Scene(engine, { useFloatingOrigin: true });
        starMapScene.useRightHandedSystem = true;
        starMapScene.clearColor.set(0, 0, 0, 1);

        const mainHavokPlugin = new HavokPlugin(true, havokInstance);
        mainHavokPlugin.setVelocityLimits(10_000, 10_000);
        starSystemViewScene.enablePhysics(Vector3.Zero(), mainHavokPlugin);

        const starSystemViewPhysicsEngine = starSystemViewScene.getPhysicsEngine() as PhysicsEngineV2;

        const loadingProgressMonitor = new LoadingProgressMonitor();
        loadingProgressMonitor.addProgressCallback((startedCount, completedCount) => {
            loadingScreen.setProgress(startedCount, completedCount);
        });

        const starSystemViewAssetsPromise = loadAssets(starSystemViewScene, audioEngine, loadingProgressMonitor);

        const starMapViewAssetsPromise = loadStarMapTextures(starMapScene, loadingProgressMonitor);

        const starSystemViewAssets = await starSystemViewAssetsPromise;
        const starMapViewAssets = await starMapViewAssetsPromise;

        const soundPlayer = new SoundPlayer(starSystemViewAssets.audio.sounds);
        const tts = new Tts(starSystemViewAssets.audio.speakerVoiceLines);
        const notificationManager = new NotificationManager(soundPlayer);

        // Init star system view
        const starSystemView = new StarSystemView(
            starSystemViewScene,
            player,
            engine,
            starSystemViewPhysicsEngine,
            backend.encyclopaedia,
            backend.universe,
            soundPlayer,
            tts,
            notificationManager,
            starSystemViewAssets.rendering,
        );

        const starMapView = new StarMapView(
            player,
            starMapScene,
            starMapViewAssets,
            backend.encyclopaedia,
            backend.universe,
            soundPlayer,
            notificationManager,
        );

        await starSystemView.resetPlayer();

        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();

        if (keyboardLayoutMap === null) {
            await alertModal(i18n.t("notifications:unknownKeyboardLayout"), soundPlayer);
        }

        return new CosmosJourneyer(
            player,
            engine,
            audioEngine,
            starSystemViewAssets,
            starSystemView,
            starMapView,
            backend,
            soundPlayer,
            tts,
            notificationManager,
        );
    }

    public pause(): void {
        if (this.isPaused()) return;
        if (this.mainMenu.isVisible()) return;
        this.state = EngineState.PAUSED;

        document.exitPointerLock();

        if (this.activeView === this.starSystemView) {
            this.starSystemView.stopBackgroundSounds();
        }

        this.soundPlayer.playNow(SoundType.OPEN_PAUSE_MENU);
        this.pauseMenu.setVisibility(true);
    }

    public async resume(): Promise<void> {
        if (!this.isPaused()) return;
        this.state = EngineState.RUNNING;
        this.soundPlayer.playNow(SoundType.CLICK);
        this.pauseMenu.setVisibility(false);

        if (
            this.activeView === this.starSystemView &&
            this.starSystemView.scene.getActiveControls().shouldLockPointer()
        ) {
            await this.engine.getRenderingCanvas()?.requestPointerLock();
        }
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

            this.autoSaveTimerSeconds += deltaSeconds;
            if (this.autoSaveTimerSeconds >= this.autoSavePeriodSeconds) {
                this.autoSaveTimerSeconds %= this.autoSavePeriodSeconds;

                if (!this.mainMenu.isVisible() && !this.starSystemView.isJumpingBetweenSystems()) {
                    // don't autosave if the main menu is visible: the player is not in the game yet
                    // don't autosave when jumping between systems
                    void this.createAutoSave();
                }
            }

            this.notificationManager.update(deltaSeconds);
            this.musicConductor.update(
                this.isPaused(),
                this.activeView === this.starSystemView,
                this.mainMenu.isVisible(),
                deltaSeconds,
            );
            this.soundPlayer.update();
            this.tts.update();

            if (this.isPaused()) return;
            this.activeView.render();
        });
        this.state = EngineState.RUNNING;
    }

    /**
     * Toggles the star map
     */
    public async toggleStarMap(): Promise<void> {
        if (this.activeView === this.starSystemView) {
            this.soundPlayer.setInstanceMask(AudioMasks.STAR_MAP_VIEW);

            this.starSystemView.targetCursorLayer.setEnabled(false);
            document.exitPointerLock();

            this.starSystemView.detachControl();
            this.starMap.attachControl();

            const starMap = this.starMap;
            this.activeView = starMap;
            starMap.focusOnCurrentSystem();
        } else {
            this.starMap.detachControl();
            this.starSystemView.attachControl();

            this.soundPlayer.setInstanceMask(AudioMasks.STAR_SYSTEM_VIEW);
            this.activeView = this.starSystemView;

            if (this.starSystemView.scene.getActiveControls().shouldLockPointer()) {
                await this.engine.getRenderingCanvas()?.requestPointerLock();
            }
        }
    }

    /**
     * Takes a screenshot of the current scene. By default, the screenshot is taken at a 4x the resolution of the canvas
     */
    public async takeScreenshot(): Promise<boolean> {
        const camera = this.activeView.getMainScene().activeCamera;
        if (camera === null) {
            await alertModal("Cannot take screenshot: camera is null", this.soundPlayer);
            return false;
        }

        Tools.CreateScreenshot(this.engine, camera, { precision: 1 });
        return true;
    }

    public async takeVideoCapture(): Promise<void> {
        if (!VideoRecorder.IsSupported(this.engine)) {
            console.warn("Your browser does not support video recording!");
            return;
        }

        if (this.videoRecorder === null) {
            this.videoRecorder = new VideoRecorder(this.engine, {
                fps: 60,
                recordChunckSize: 3000000,
                mimeType: "video/webm;codecs=h264",
            });
        }

        if (this.videoRecorder.isRecording) {
            this.videoRecorder.stopRecording();
        } else {
            await this.videoRecorder
                .startRecording("planetEngine.webm", Number(prompt("Enter video duration in seconds", "10")))
                .then();
        }
    }

    public getCurrentUniverseCoordinates(transform: TransformNode): RelativeCoordinates {
        const currentStarSystem = this.starSystemView.getStarSystem();

        const currentWorldPosition = transform.getAbsolutePosition();

        // Finding the index of the nearest orbital object
        const nearestOrbitalObject = currentStarSystem.getNearestOrbitalObject(currentWorldPosition);

        const universeObjectId = getUniverseObjectId(nearestOrbitalObject.model, currentStarSystem.model);

        // Finding the position of the player in the nearest orbital object's frame of reference
        const nearestOrbitalObjectInverseWorld = nearestOrbitalObject
            .getTransform()
            .computeWorldMatrix(true)
            .clone()
            .invert();
        const currentLocalPosition = Vector3.TransformCoordinates(
            currentWorldPosition,
            nearestOrbitalObjectInverseWorld,
        );

        const distanceToNearestOrbitalObject = currentLocalPosition.length();
        if (distanceToNearestOrbitalObject < nearestOrbitalObject.getBoundingRadius() * 1.1) {
            currentLocalPosition.copyFromFloats(0, 0, nearestOrbitalObject.getBoundingRadius() * 5.0);
        }

        // Finding the rotation of the player in the nearest orbital object's frame of reference
        const currentWorldRotation = transform.absoluteRotationQuaternion;
        const nearestOrbitalObjectInverseRotation = nearestOrbitalObject
            .getTransform()
            .absoluteRotationQuaternion.clone()
            .invert();

        const currentLocalRotation = currentWorldRotation.multiply(nearestOrbitalObjectInverseRotation);

        return {
            type: "relative",
            universeObjectId: universeObjectId,
            position: {
                x: currentLocalPosition.x,
                y: currentLocalPosition.y,
                z: currentLocalPosition.z,
            },
            rotation: {
                x: currentLocalRotation.x,
                y: currentLocalRotation.y,
                z: currentLocalRotation.z,
                w: currentLocalRotation.w,
            },
        };
    }

    /**
     * Generates a save file data object from the current star system and the player's position
     */
    public async generateSaveData(): Promise<Save> {
        const spaceShipControls = this.starSystemView.getSpaceshipControls();
        const spaceship = spaceShipControls.getSpaceship();

        const shipUniverseCoordinates = this.getCurrentUniverseCoordinates(spaceShipControls.getTransform());

        const shipLocation: UniverseCoordinates = spaceship.isLandedAtFacility()
            ? {
                  type: "atStation",
                  universeObjectId: shipUniverseCoordinates.universeObjectId,
              }
            : shipUniverseCoordinates;

        const camera = this.activeView.getMainScene().activeCamera;
        let thumbnail = "";
        if (camera) {
            thumbnail = await Tools.CreateScreenshotAsync(this.engine, camera, {
                width: 320,
                height: 180,
                precision: 0.8,
            });
        }

        return {
            uuid: crypto.randomUUID(),
            timestamp: Date.now(),
            player: Player.Serialize(this.player),
            playerLocation: {
                type: "inSpaceship",
                shipId: spaceship.id,
            },
            shipLocations: {
                [spaceship.id]: shipLocation,
            },
            thumbnail: thumbnail,
        };
    }

    public async createManualSave(): Promise<boolean> {
        if (this.player.uuid === Settings.TUTORIAL_SAVE_UUID) return false; // don't save in tutorial
        if (this.player.uuid === Settings.SHARED_POSITION_SAVE_UUID) {
            this.player.uuid = crypto.randomUUID();
            this.player.setName(
                (await promptModalString(
                    i18n.t("spaceStation:cmdrNameChangePrompt"),
                    this.player.getName(),
                    this.soundPlayer,
                )) ?? "Python",
            );
        }

        const saveData = await this.generateSaveData();
        const uuid = saveData.player.uuid;

        return this.backend.save.addManualSave(uuid, saveData);
    }

    public setAutoSaveEnabled(isEnabled: boolean): void {
        this.isAutoSaveEnabled = isEnabled;
    }

    /**
     * Generate save file data and store it in the autosaves hashmap in local storage
     */
    public async createAutoSave(): Promise<void> {
        if (!this.isAutoSaveEnabled) return;

        const saveData = await this.generateSaveData();

        // use player uuid as key to avoid overwriting other cmdr's autosave
        const uuid = saveData.player.uuid;

        if (uuid === Settings.SHARED_POSITION_SAVE_UUID) return; // don't autosave shared position
        if (uuid === Settings.TUTORIAL_SAVE_UUID) return; // don't autosave in tutorial

        await this.backend.save.addAutoSave(uuid, saveData);

        this.autoSaveTimerSeconds = 0;
    }

    /**
     * Generates save file data and downloads it as a json file
     */
    public downloadSaveFile(): void {
        this.engine.onEndFrameObservable.addOnce(async () => {
            const saveData = await this.generateSaveData();
            const blob = new Blob([JSON.stringify(saveData)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const dateString = new Date().toLocaleString().replace(/[^0-9a-zA-Z]/g, "_"); // avoid special characters in the filename
            link.download = `CMDR_${this.player.getName()}_${dateString}.json`;
            link.click();
        });
    }

    public loadTutorial(tutorial: Tutorial) {
        this.engine.onEndFrameObservable.addOnce(async () => {
            this.mainMenu.hide();
            if (!this.mainMenu.isVisible()) {
                await this.createAutoSave();
            }
            const saveResult = tutorial.getSaveData(this.backend.universe);
            if (!saveResult.success) {
                console.error(saveResult.error);
                await alertModal(
                    i18n.t(
                        "The tutorial save has errors and could not be loaded! Check the console for more information.",
                    ),
                    this.soundPlayer,
                );
                return;
            }

            await this.loadSave(saveResult.value);
            this.player.uuid = Settings.TUTORIAL_SAVE_UUID;
            await this.resume();
            await this.tutorialLayer.setTutorial(tutorial);
            this.starSystemView.setUIEnabled(true);

            const targetObject = this.starSystemView
                .getStarSystem()
                .getNearestOrbitalObject(
                    this.starSystemView.scene.getActiveControls().getTransform().getAbsolutePosition(),
                );

            lookAt(
                this.starSystemView.getSpaceshipControls().getTransform(),
                targetObject.getTransform().getAbsolutePosition(),
                this.starSystemView.scene.useRightHandedSystem,
            );
        });
    }

    /**
     * Loads a save file and apply it. This will generate the requested star system and position the player at the requested position around the requested orbital object.
     * This will perform engine initialization if the engine is not initialized.
     * @param saveData The save file data to load
     */
    public async loadSave(saveData: DeepReadonly<Save>): Promise<void> {
        const playerLocation = saveData.playerLocation;

        let locationToUse;
        if (playerLocation.type !== "inSpaceship") {
            locationToUse = playerLocation;
        } else {
            const shipLocation = saveData.shipLocations[playerLocation.shipId];
            if (shipLocation === undefined) {
                await alertModal(
                    "Player is in spaceship, but said spaceship does not exist. The loading procedure has been aborted.",
                    this.soundPlayer,
                );
                return;
            }

            if (shipLocation.type === "inSpaceship") {
                await alertModal(
                    "Spaceship inside spaceships is not yet supported. The loading procedure has been aborted.",
                    this.soundPlayer,
                );
                return;
            }

            locationToUse = shipLocation;
        }

        const systemModel = this.backend.universe.getSystemModelFromCoordinates(
            locationToUse.universeObjectId.systemCoordinates,
        );

        if (systemModel === null) {
            await alertModal(
                "Cannot load universe coordinates: system model not found. The loading procedure has been aborted.",
                this.soundPlayer,
            );
            return;
        }

        const newPlayer = Player.Deserialize(saveData.player, this.backend.universe);
        this.player.copyFrom(newPlayer, this.backend.universe);
        this.player.discoveries.uploaded.forEach(async (discovery) => {
            await this.backend.encyclopaedia.contributeDiscoveryIfNew(discovery);
        });
        await this.starSystemView.resetPlayer();

        this.engine.loadingScreen.displayLoadingUI();

        await this.starSystemView.loadStarSystem(systemModel);

        if (this.state === EngineState.UNINITIALIZED) {
            await this.init(true);
        } else {
            this.starSystemView.initStarSystem();
        }

        if (playerLocation.type === "inSpaceship") {
            await this.starSystemView.switchToSpaceshipControls();
        } else {
            await this.starSystemView.switchToCharacterControls();
        }

        await this.loadLocation(locationToUse);

        this.engine.loadingScreen.hideLoadingUI();

        if (this.player.currentItinerary !== null) {
            this.starSystemView.setSystemAsTarget(this.player.currentItinerary[1]);
        }
    }

    public async loadLocation(location: UniverseCoordinates) {
        if (location.type === "relative") {
            await this.loadRelativeLocation(location);
        } else if (location.type === "atStation") {
            await this.loadAtStationLocation(location);
        }
    }

    public async loadRelativeLocation(location: RelativeCoordinates) {
        const playerTransform = this.starSystemView.scene.getActiveControls().getTransform();
        const starSystem = this.starSystemView.getStarSystem();
        const nearestOrbitalObject = starSystem.getOrbitalObjectById(location.universeObjectId.idInSystem);

        if (nearestOrbitalObject === undefined) {
            const fallbackObject = starSystem.getStellarObjects()[0];
            positionNearObject(
                fallbackObject,
                new Vector3(0, 0, fallbackObject.getBoundingRadius() * 4),
                new Quaternion(0, 0, 0, 1),
                playerTransform,
            );

            await alertModal(
                "The object you are trying to spawn near to could not be found. You will spawn around the first stellar object of the system instead.",
                this.soundPlayer,
            );

            return;
        }

        positionNearObject(
            nearestOrbitalObject,
            new Vector3(location.position.x, location.position.y, location.position.z),
            new Quaternion(location.rotation.x, location.rotation.y, location.rotation.z, location.rotation.w),
            playerTransform,
        );

        const distanceToObject = Vector3.Distance(
            playerTransform.getAbsolutePosition(),
            nearestOrbitalObject.getTransform().getAbsolutePosition(),
        );
        const objectRadius = nearestOrbitalObject.getBoundingRadius();

        if (distanceToObject < objectRadius * 1.1) {
            if (distanceToObject < 0.1) {
                playerTransform.position.addInPlace(new Vector3(0, 0, objectRadius * 5.0));
            } else {
                playerTransform.position.scaleInPlace((objectRadius * 1.1) / distanceToObject);
            }
        }

        // set the ui target to the nearest orbital object
        this.starSystemView.targetCursorLayer.setTarget(nearestOrbitalObject);
        this.starSystemView.spaceShipLayer.setTarget(nearestOrbitalObject.getTransform());
    }

    public async loadAtStationLocation(location: AtStationCoordinates) {
        const playerTransform = this.starSystemView.scene.getActiveControls().getTransform();
        const starSystem = this.starSystemView.getStarSystem();
        const station = starSystem.getOrbitalObjectById(location.universeObjectId.idInSystem);

        const doesStationExist =
            station !== undefined && (station.type === "spaceStation" || station.type === "spaceElevator");

        if (!doesStationExist) {
            const fallbackObject = starSystem.getStellarObjects()[0];

            positionNearObject(
                fallbackObject,
                new Vector3(0, 0, fallbackObject.getBoundingRadius() * 4),
                new Quaternion(0, 0, 0, 1),
                playerTransform,
            );

            await alertModal(
                "The space station you are trying to spawn at could not be found. You will spawn around the first stellar object of the system instead.",
                this.soundPlayer,
            );

            return;
        }

        const landingPad = station.getLandingPadManager().getAvailableLandingPads().at(0);
        if (landingPad === undefined) {
            const fallbackObject = station;

            positionNearObject(
                fallbackObject,
                new Vector3(0, 0, fallbackObject.getBoundingRadius() * 4),
                new Quaternion(0, 0, 0, 1),
                playerTransform,
            );

            await alertModal(
                "There are no available pads at the space station you are trying to spawn at. You have been moved outside of the station instead.",
                this.soundPlayer,
            );

            return;
        }

        this.starSystemView.getSpaceshipControls().getSpaceship().spawnOnPad(landingPad);
    }
}
