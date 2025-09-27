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

import "@babylonjs/core/Loading/loadingScreen";

import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { Observable } from "@babylonjs/core/Misc/observable";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { type HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { AxisComposite } from "@brianchirls/game-input/browser";
import type DPadComposite from "@brianchirls/game-input/controls/DPadComposite";

import { type EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { ItinerarySchema } from "@/backend/player/serializedPlayer";
import { OrbitalObjectType } from "@/backend/universe/orbitalObjects/orbitalObjectType";
import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemDatabase } from "@/backend/universe/starSystemDatabase";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";
import { getUniverseObjectId, type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { AudioMasks } from "@/frontend/audio/audioMasks";
import { SoundType, type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { Speaker, VoiceLine, type ITts } from "@/frontend/audio/tts";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DefaultControlsInputs } from "@/frontend/controls/defaultControls/defaultControlsInputs";
import { StarSystemInputs } from "@/frontend/inputs/starSystemInputs";
import { type Mission } from "@/frontend/missions/mission";
import { type MissionContext } from "@/frontend/missions/missionContext";
import { PostProcessManager } from "@/frontend/postProcesses/postProcessManager";
import { ShipControls } from "@/frontend/spaceship/shipControls";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";
import { TransformRotationAnimation } from "@/frontend/uberCore/transforms/animations/rotation";
import {
    getRotationQuaternion,
    lookAt,
    setRotationQuaternion,
    translate,
} from "@/frontend/uberCore/transforms/basicTransform";
import { type UberScene } from "@/frontend/uberCore/uberScene";
import { alertModal } from "@/frontend/ui/dialogModal";
import { createNotification, NotificationIntent, NotificationOrigin } from "@/frontend/ui/notification";
import { SpaceShipLayer } from "@/frontend/ui/spaceShipLayer";
import { SpaceStationLayer } from "@/frontend/ui/spaceStation/spaceStationLayer";
import { TargetCursorLayer } from "@/frontend/ui/targetCursorLayer";
import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { AxisRenderer } from "@/frontend/universe/axisRenderer";
import { LandingPadSize } from "@/frontend/universe/orbitalFacility/landingPadManager";
import { OrbitRenderer } from "@/frontend/universe/orbitRenderer";
import { type ChunkForge } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForge";
import { ChunkForgeWorkers } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";
import { StarSystemController } from "@/frontend/universe/starSystemController";
import { StarSystemLoader } from "@/frontend/universe/starSystemLoader";
import { BlackHole } from "@/frontend/universe/stellarObjects/blackHole/blackHole";
import { NeutronStar } from "@/frontend/universe/stellarObjects/neutronStar/neutronStar";
import { SystemTarget } from "@/frontend/universe/systemTarget";
import { type View } from "@/frontend/view";

import { wrapVector3 } from "@/utils/algebra";
import { getNeighborStarSystemCoordinates } from "@/utils/getNeighborStarSystems";
import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";
import { metersToLightYears } from "@/utils/physics/unitConversions";
import { positionNearObjectBrightSide } from "@/utils/positionNearObject";
import { axisCompositeToString, dPadCompositeToString } from "@/utils/strings/inputControlsString";
import { type DeepReadonly } from "@/utils/types";

import i18n from "@/i18n";
import { Settings } from "@/settings";

import { AiPlayerControls } from "./player/aiPlayerControls";
import { type Player } from "./player/player";
import { isScannerInRange } from "./spaceship/components/discoveryScanner";
import { type Transformable } from "./universe/architecture/transformable";
import { type TypedObject } from "./universe/architecture/typedObject";
import { CreateLinesHelper } from "./universe/lineRendering";

// register cosmos journeyer as part of window object
declare global {
    interface Window {
        StarSystemView: StarSystemView;
    }
}

/**
 * The star system view is the part of Cosmos Journeyer responsible to display the current star system, along with the
 * player's spaceship, character and GUI. It also handles the loading of the star system and its initialization.
 * While the player may travel to another star system, the star system view stays the same, only the star system controller changes.
 */
export class StarSystemView implements View {
    /**
     * The HTML GUI used to display orbital objects cursors and information when targeted.
     */
    readonly targetCursorLayer: TargetCursorLayer;

    /**
     * The HTML UI responsible for the name of the closest orbital object, the velocity of the spaceship and the target helper radar.
     */
    readonly spaceShipLayer: SpaceShipLayer;

    /**
     * The HTML UI responsible for the interaction with space stations
     */
    readonly spaceStationLayer: SpaceStationLayer;

    private isUiEnabled = true;

    private readonly player: Player;

    private readonly aiPlayers: AiPlayerControls[] = [];

    private readonly encyclopaedia: EncyclopaediaGalacticaManager;

    private readonly starSystemDatabase: StarSystemDatabase;

    /**
     * The BabylonJS scene, upgraded with some helper methods and properties
     */
    readonly scene: UberScene;

    /**
     * The Havok physics plugin used inside the scene
     */
    readonly havokPlugin: HavokPlugin;

    /**
     * The default controls are used for debug purposes. They allow to move freely between orbital objects without speed limitations.
     * @private
     */
    private defaultControls: DefaultControls | null = null;

    /**
     * The spaceship controls are used to control the spaceship. They allow to move the spaceship and to enable the warp drive.
     * @private
     */
    private spaceshipControls: ShipControls | null = null;

    /**
     * The character controls are used to control the character when out of the spaceship. They allow to move the character.
     * @private
     */
    private characterControls: CharacterControls | null = null;

    /**
     * A debug helper to display the orbits of the orbital objects
     * @private
     */
    private readonly orbitRenderer: OrbitRenderer = new OrbitRenderer(CreateLinesHelper);

    /**
     * A debug helper to display the axes of the orbital objects
     * @private
     */
    private readonly axisRenderer: AxisRenderer = new AxisRenderer(CreateLinesHelper);

    /**
     * The controller of the current star system. This controller is unique per star system and is destroyed when the star system is changed.
     * @private
     */
    private starSystem: StarSystemController | null = null;

    /**
     * The star system loader used to load the star system. It is constant for the whole game.
     */
    readonly loader: StarSystemLoader = new StarSystemLoader();

    /**
     * The chunk forge used to generate surface chunks for telluric planets. It is constant for the whole game.
     * @private
     */
    private readonly chunkForge: ChunkForge = new ChunkForgeWorkers(Settings.VERTEX_RESOLUTION);

    /**
     * An observable that notifies when the star system is initialized.
     * This is when the current star system becomes playable and the post processes are initialized.
     */
    readonly onInitStarSystem = new Observable<void>();

    /**
     * An observable that notifies when the player is about to jump to another star system.
     */
    readonly onBeforeJump = new Observable<void>();

    /**
     * An observable that notifies when the player has jumped to another star system.
     */
    readonly onAfterJump = new Observable<void>();

    /**
     * A lock to prevent multiple executions of the jump to system action
     * @private
     */
    private jumpLock = false;

    /**
     * Whether the star system is currently loading or not
     * @private
     */
    private _isLoadingSystem = false;

    readonly onNewDiscovery = new Observable<UniverseObjectId>();

    readonly postProcessManager: PostProcessManager;

    private keyboardLayoutMap: Map<string, string> = new Map();

    private readonly soundPlayer: ISoundPlayer;
    private readonly tts: ITts;

    private readonly assets: RenderingAssets;

    /**
     * Creates an empty star system view with a scene, a gui and a havok plugin
     * To fill it with a star system, use `loadStarSystem` and then `initStarSystem`
     * @param player The player object shared with the rest of the game
     * @param engine The BabylonJS engine
     * @param havokPlugin The Havok physics plugin instance
     */
    constructor(
        scene: UberScene,
        player: Player,
        engine: AbstractEngine,
        havokPlugin: HavokPlugin,
        encyclopaedia: EncyclopaediaGalacticaManager,
        starSystemDatabase: StarSystemDatabase,
        soundPlayer: ISoundPlayer,
        tts: ITts,
        assets: RenderingAssets,
    ) {
        this.player = player;
        this.encyclopaedia = encyclopaedia;
        this.starSystemDatabase = starSystemDatabase;

        this.spaceShipLayer = new SpaceShipLayer(this.player, this.starSystemDatabase, soundPlayer);
        document.body.appendChild(this.spaceShipLayer.root);

        this.scene = scene;
        this.scene.skipPointerMovePicking = true;
        this.scene.autoClear = false;

        this.havokPlugin = havokPlugin;

        this.soundPlayer = soundPlayer;
        this.tts = tts;
        this.assets = assets;

        void getGlobalKeyboardLayoutMap().then((keyboardLayoutMap) => {
            this.keyboardLayoutMap = keyboardLayoutMap ?? new Map<string, string>();
        });

        StarSystemInputs.map.toggleUi.on("complete", () => {
            this.isUiEnabled = !this.isUiEnabled;
            this.soundPlayer.playNow(SoundType.CLICK);
        });

        StarSystemInputs.map.toggleOrbitsAndAxis.on("complete", () => {
            const enabled = !this.orbitRenderer.isVisible();
            if (enabled) this.soundPlayer.playNow(SoundType.ENABLE_ORBIT_DISPLAY);
            else this.soundPlayer.playNow(SoundType.DISABLE_ORBIT_DISPLAY);
            this.orbitRenderer.setVisibility(enabled);
            this.axisRenderer.setVisibility(enabled);
        });

        StarSystemInputs.map.cycleViews.on("complete", async () => {
            if (this.scene.getActiveControls() === this.getSpaceshipControls()) {
                await this.switchToDefaultControls(true);
            } else if (this.scene.getActiveControls() === this.getDefaultControls()) {
                await this.switchToCharacterControls();
            } else if (this.scene.getActiveControls() === this.getCharacterControls()) {
                await this.switchToSpaceshipControls();
            }
        });

        StarSystemInputs.map.setTarget.on("complete", () => {
            const closestObjectToCenter = this.targetCursorLayer.getClosestToScreenCenterOrbitalObject();
            this.setTarget(closestObjectToCenter);
        });

        StarSystemInputs.map.jumpToSystem.on("complete", async () => {
            const target = this.targetCursorLayer.getTarget();
            if (!(target instanceof SystemTarget)) return;

            const shipControls = this.getSpaceshipControls();
            const spaceship = shipControls.getSpaceship();

            const warpDrive = spaceship.getInternals().getWarpDrive();
            if (warpDrive === null) {
                return;
            }

            if (!this.jumpLock) this.jumpLock = true;
            else return;

            const currentSystemPosition = wrapVector3(
                this.starSystemDatabase.getSystemGalacticPosition(this.getStarSystem().model.coordinates),
            );
            const targetSystemPosition = wrapVector3(
                this.starSystemDatabase.getSystemGalacticPosition(target.systemCoordinates),
            );

            const distanceLY = Vector3.Distance(currentSystemPosition, targetSystemPosition);

            const fuelForJump = warpDrive.getHyperJumpFuelConsumption(distanceLY);

            if (spaceship.getRemainingFuel() < fuelForJump) {
                createNotification(
                    NotificationOrigin.SPACESHIP,
                    NotificationIntent.ERROR,
                    i18n.t("notifications:notEnoughFuel"),
                    5000,
                    this.soundPlayer,
                );
                this.jumpLock = false;
                return;
            }

            // first, align spaceship with target
            const currentForward = shipControls.getTransform().forward;
            const targetForward = target
                .getTransform()
                .getAbsolutePosition()
                .subtract(shipControls.getTransform().getAbsolutePosition())
                .normalize();

            const rotationAxis = Vector3.Cross(currentForward, targetForward);
            const rotationAngle = Vector3.GetAngleBetweenVectors(currentForward, targetForward, rotationAxis);

            const rotationAnimation = new TransformRotationAnimation(
                shipControls.getTransform(),
                rotationAxis,
                rotationAngle,
                rotationAngle * 2,
            );
            await new Promise<void>((resolve) => {
                const observer = this.scene.onBeforePhysicsObservable.add(() => {
                    rotationAnimation.update(this.scene.getEngine().getDeltaTime() / 1000);
                    if (rotationAnimation.isFinished()) {
                        observer.remove();
                        resolve();
                    }
                });
            });

            this.onBeforeJump.notifyObservers();

            // then, initiate hyper space jump
            if (!warpDrive.isEnabled()) spaceship.enableWarpDrive();
            spaceship.hyperSpaceTunnel.setEnabled(true);
            spaceship.warpTunnel.getTransform().setEnabled(false);
            spaceship.hyperSpaceSound.setVolume(1);
            soundPlayer.setInstanceMask(AudioMasks.HYPER_SPACE);
            const observer = this.scene.onBeforeRenderObservable.add(() => {
                const deltaSeconds = this.scene.getEngine().getDeltaTime() / 1000;
                spaceship.hyperSpaceTunnel.update(deltaSeconds);
                spaceship.warpTunnel.update(deltaSeconds);
            });

            spaceship.burnFuel(fuelForJump);

            const starSystemCoordinates = target.systemCoordinates;
            const systemModel = this.starSystemDatabase.getSystemModelFromCoordinates(starSystemCoordinates);
            if (systemModel === null) {
                throw new Error("System model not found for coordinates generated by getNeighborStarSystemCoordinates");
            }
            await this.loadStarSystem(systemModel);
            this.initStarSystem();

            spaceship.hyperSpaceTunnel.setEnabled(false);
            spaceship.warpTunnel.getTransform().setEnabled(true);
            spaceship.hyperSpaceSound.setVolume(0);

            soundPlayer.setInstanceMask(AudioMasks.STAR_SYSTEM_VIEW);
            observer.remove();
            this.jumpLock = false;

            this.player.visitedSystemHistory.push(this.getStarSystem().model.coordinates);

            this.onAfterJump.notifyObservers();
        });

        StarSystemInputs.map.toggleSpaceShipCharacter.on("complete", async () => {
            const characterControls = this.getCharacterControls();
            const shipControls = this.getSpaceshipControls();
            const spaceship = shipControls.getSpaceship();

            const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();

            if (this.scene.getActiveControls() === shipControls) {
                characterControls.getTransform().setEnabled(true);
                CharacterInputs.setEnabled(true);
                characterControls.getTransform().setAbsolutePosition(shipControls.getTransform().absolutePosition);
                translate(
                    characterControls.getTransform(),
                    shipControls.getTransform().forward.scale(3 + shipControls.getSpaceship().boundingExtent.z / 2),
                );

                setRotationQuaternion(
                    characterControls.getTransform(),
                    getRotationQuaternion(shipControls.getTransform()).clone(),
                );
                SpaceShipControlsInputs.setEnabled(false);
                this.spaceShipLayer.setVisibility(false);

                await this.scene.setActiveControls(characterControls);

                spaceship.acceleratingWarpDriveSound.setVolume(0);
                spaceship.deceleratingWarpDriveSound.setVolume(0);
            } else if (this.scene.getActiveControls() === characterControls) {
                characterControls.getTransform().setEnabled(false);
                CharacterInputs.setEnabled(false);

                await this.scene.setActiveControls(shipControls);
                SpaceShipControlsInputs.setEnabled(true);

                if (spaceship.isLanded()) {
                    const bindings = SpaceShipControlsInputs.map.upDown.bindings;
                    const control = bindings[0]?.control;
                    if (!(control instanceof AxisComposite)) {
                        throw new Error("Up down is not an axis composite");
                    }
                    createNotification(
                        NotificationOrigin.SPACESHIP,
                        NotificationIntent.INFO,
                        i18n.t("notifications:howToLiftOff", {
                            bindingsString: axisCompositeToString(control, keyboardLayoutMap)[1]?.[1],
                        }),
                        5000,
                        this.soundPlayer,
                    );
                }
            }
        });

        StarSystemInputs.map.printDebugInfo.on("complete", () => {
            const object = this.getStarSystem().getNearestOrbitalObject(Vector3.Zero());
            console.log(getUniverseObjectId(object.model, this.getStarSystem().model));
        });

        // small ambient light helps with seeing dark objects. This is unrealistic but I feel it is better.
        const ambientLight = new HemisphericLight("ambientLight", Vector3.Zero(), this.scene);
        ambientLight.intensity = 0.02;

        this.postProcessManager = new PostProcessManager(assets.textures, this.scene);

        // main update loop for the star system
        this.scene.onBeforePhysicsObservable.add(() => {
            const deltaSeconds = engine.getDeltaTime() / 1000;
            this.updateBeforePhysics(deltaSeconds * Settings.TIME_MULTIPLIER);
        });

        this.scene.onBeforeRenderObservable.add(() => {
            const deltaSeconds = (engine.getDeltaTime() * Settings.TIME_MULTIPLIER) / 1000;
            this.updateBeforeRender(deltaSeconds);
        });

        this.scene.onAfterRenderObservable.add(() => {
            this.updateAfterRender();
        });

        this.spaceShipLayer.setVisibility(false);

        this.spaceStationLayer = new SpaceStationLayer(
            this.player,
            this.encyclopaedia,
            this.starSystemDatabase,
            this.soundPlayer,
        );
        this.spaceStationLayer.setVisibility(false);
        this.spaceStationLayer.onTakeOffObservable.add(() => {
            this.getSpaceshipControls().getSpaceship().takeOff();
        });

        this.targetCursorLayer = new TargetCursorLayer();

        window.StarSystemView = this;
    }

    /**
     * Dispose the previous star system and incrementally loads the new star system. All the assets are instantiated but the system still need to be initialized
     * @param starSystemModel
     */
    public async loadStarSystem(starSystemModel: DeepReadonly<StarSystemModel>) {
        if (this._isLoadingSystem) {
            throw new Error("Cannot load a new star system while the current one is loading");
        }
        this._isLoadingSystem = true;

        if (this.starSystem !== null) {
            this.aiPlayers.forEach((aiPlayer) => {
                aiPlayer.dispose(this.soundPlayer);
            });
            this.aiPlayers.length = 0;

            this.spaceshipControls?.setClosestLandableFacility(null);
            this.characterControls?.setClosestWalkableObject(null);
            this.chunkForge.reset();
            this.postProcessManager.reset();
            this.starSystem.dispose();
            this.targetCursorLayer.reset();
            this.spaceStationLayer.reset();

            this.player.visitedSystemHistory.push(this.starSystem.model.coordinates);
        }

        this.starSystem = await StarSystemController.CreateAsync(starSystemModel, this.loader, this.assets, this.scene);

        return this.starSystem;
    }

    /**
     * Initializes the star system. It initializes the positions of the orbital objects, the UI, the chunk forge and the post processes
     * As it initializes the post processes using `initPostProcesses`, it returns a promise that resolves when the post processes are initialized.
     */
    public initStarSystem(): void {
        const starSystem = this.getStarSystem();
        starSystem.initPositions(2, this.chunkForge);
        this.targetCursorLayer.reset();

        this.postProcessManager.addCelestialBodies(starSystem.getCelestialBodies(), starSystem.getStellarObjects(), [
            starSystem.starFieldBox.mesh,
        ]);

        const celestialBodies = starSystem.getCelestialBodies();
        const spaceStations = starSystem.getOrbitalFacilities();

        celestialBodies.forEach((body) => {
            this.targetCursorLayer.addObject(body);
        });

        spaceStations.forEach((spaceStation) => {
            this.targetCursorLayer.addObject(spaceStation);

            spaceStation.getSubTargets().forEach((landingPad) => {
                this.targetCursorLayer.addObject(landingPad);
            });

            for (let i = 0; i < Math.ceil(Math.random() * 15); i++) {
                const aiPlayer = new AiPlayerControls(
                    this.starSystemDatabase,
                    this.scene,
                    this.assets,
                    this.soundPlayer,
                );

                const landingPad = spaceStation.getLandingPadManager().handleLandingRequest({
                    minimumPadSize: LandingPadSize.SMALL,
                });

                if (landingPad === null) {
                    aiPlayer.dispose(this.soundPlayer);
                    break;
                }

                this.aiPlayers.push(aiPlayer);
                aiPlayer.spaceshipControls.spaceship.spawnOnPad(landingPad);
            }
        });

        this.orbitRenderer.setOrbitalObjects(starSystem.getOrbitalObjects(), this.scene);
        this.axisRenderer.setOrbitalObjects(starSystem.getOrbitalObjects(), this.scene);

        this.spaceShipLayer.setTarget(null);
        this.targetCursorLayer.setTarget(null);

        const firstBody = celestialBodies[0];
        if (firstBody === undefined) throw new Error("No bodies in star system");

        const activeControls = this.scene.getActiveControls();
        let controllerDistanceFactor = 4;
        if (firstBody instanceof BlackHole) controllerDistanceFactor = 50;
        else if (firstBody instanceof NeutronStar) controllerDistanceFactor = 100_000;

        const previousSystem = this.player.visitedSystemHistory.at(-1);
        if (previousSystem === undefined) {
            positionNearObjectBrightSide(activeControls, firstBody, starSystem, controllerDistanceFactor);
        } else {
            // place player in the direction of the previous system (where we came from)
            const currentSystemPosition = wrapVector3(
                this.starSystemDatabase.getSystemGalacticPosition(starSystem.model.coordinates),
            );
            const previousSystemPosition = wrapVector3(
                this.starSystemDatabase.getSystemGalacticPosition(previousSystem),
            );

            // compute direction from previous system to current system
            const placementDirection = previousSystemPosition.subtract(currentSystemPosition).normalize();
            Vector3.TransformCoordinatesToRef(
                placementDirection,
                starSystem.getReferencePlaneRotation(),
                placementDirection,
            );

            // offset the player from the first body
            const positionOffset = placementDirection.scale(controllerDistanceFactor * firstBody.getBoundingRadius());
            activeControls
                .getTransform()
                .setAbsolutePosition(firstBody.getTransform().getAbsolutePosition().add(positionOffset));

            // put the player back to the origin of the star system
            starSystem.translateEverythingNow(activeControls.getTransform().getAbsolutePosition().negate());
            activeControls.getTransform().setAbsolutePosition(Vector3.Zero());

            // look at the first body
            lookAt(
                activeControls.getTransform(),
                firstBody.getTransform().getAbsolutePosition(),
                this.scene.useRightHandedSystem,
            );
        }

        const currentSpaceship = this.spaceshipControls?.getSpaceship();
        const currentJumpRange = currentSpaceship?.getInternals().getWarpDrive()?.rangeLY ?? 0;

        for (const neighbor of getNeighborStarSystemCoordinates(
            starSystem.model.coordinates,
            Math.min(currentJumpRange, Settings.VISIBLE_NEIGHBORHOOD_MAX_RADIUS_LY),
            this.starSystemDatabase,
        )) {
            const systemTarget = this.getStarSystem().addSystemTarget(neighbor.coordinates, this.starSystemDatabase);
            if (systemTarget === null) {
                continue;
            }
            this.targetCursorLayer.addObject(systemTarget);
        }

        if (this.player.currentItinerary !== null) {
            const targetCoordinates = this.player.currentItinerary[1];
            if (starSystemCoordinatesEquals(starSystem.model.coordinates, targetCoordinates)) {
                // the current system was the first destination of the itinerary, we can remove the system before from the itinerary
                const newItinerary = ItinerarySchema.safeParse(this.player.currentItinerary.slice(1));

                // now there are either one or more systems in the itinerary (including the current one)
                if (newItinerary.success) {
                    // if there are more than 1, the journey continues to the next system
                    this.player.currentItinerary = newItinerary.data;
                    this.setSystemAsTarget(this.player.currentItinerary[1]);
                } else {
                    // if there is only one (the current system), the journey is over
                    this.player.currentItinerary = null;
                }
            }
        }

        this.onInitStarSystem.notifyObservers();
        this.scene.getEngine().loadingScreen.hideLoadingUI();

        this._isLoadingSystem = false;
    }

    /**
     * Call this when the player object is changed when loading a save.
     * It will remove the current controls and recreate them based on the player object.
     */
    public async resetPlayer() {
        this.postProcessManager.reset();

        const maxZ = Settings.EARTH_RADIUS * 1e5;

        if (this.defaultControls === null) {
            this.defaultControls = new DefaultControls(this.scene);
            this.defaultControls.speed = 0.2 * Settings.EARTH_RADIUS;
            this.defaultControls.getCameras().forEach((camera) => (camera.maxZ = maxZ));
        }

        const spaceshipSerialized = this.player.serializedSpaceships.shift();
        if (spaceshipSerialized === undefined) throw new Error("No spaceship serialized in player");

        const spaceship = Spaceship.Deserialize(
            spaceshipSerialized,
            this.player.spareSpaceshipComponents,
            this.scene,
            this.assets,
            this.soundPlayer,
        );
        this.player.instancedSpaceships.push(spaceship);

        if (this.spaceshipControls === null) {
            this.spaceshipControls = new ShipControls(spaceship, this.scene, this.soundPlayer, this.tts);
            this.spaceshipControls.getCameras().forEach((camera) => (camera.maxZ = maxZ));
        } else {
            const oldSpaceship = this.spaceshipControls.getSpaceship();
            this.spaceshipControls.reset();
            this.spaceshipControls.setSpaceship(spaceship);
            oldSpaceship.dispose(this.soundPlayer);
        }

        if (this.characterControls === null) {
            const character = this.assets.objects.characters.default.instantiateHierarchy(null);
            if (!(character instanceof Mesh)) {
                await alertModal("Character model is not a mesh!", this.soundPlayer);
            } else {
                this.characterControls = new CharacterControls(character, this.scene);
                this.characterControls.getTransform().setEnabled(false);
                this.characterControls.getCameras().forEach((camera) => (camera.maxZ = maxZ));
            }
        }

        await this.scene.setActiveControls(this.spaceshipControls);
    }

    public isJumpingBetweenSystems() {
        return this.jumpLock;
    }

    public isLoadingSystem() {
        return this._isLoadingSystem;
    }

    /**
     * Updates the system view. It updates the underlying star system, the UI, the chunk forge and the controls
     * @param deltaSeconds the time elapsed since the last update in seconds
     */
    public updateBeforePhysics(deltaSeconds: number) {
        if (this._isLoadingSystem) return;

        const starSystem = this.getStarSystem();

        this.chunkForge.update(this.assets);

        starSystem.update(deltaSeconds, this.chunkForge);

        const nearestCelestialBody = starSystem.getNearestCelestialBody(
            this.scene.getActiveControls().getActiveCamera().globalPosition,
        );

        this.postProcessManager.setCelestialBody(nearestCelestialBody);
        this.postProcessManager.update(deltaSeconds);
    }

    public updateBeforeRender(deltaSeconds: number) {
        if (this._isLoadingSystem) return;

        const starSystem = this.getStarSystem();
        if (this.spaceshipControls === null) throw new Error("Spaceship controls is null");
        if (this.characterControls === null) throw new Error("Character controls is null");

        if (this.scene.getActiveControls().getActiveCamera() !== this.scene.activeCamera) {
            this.scene.activeCamera?.detachControl();
            this.scene.setActiveCamera(this.scene.getActiveControls().getActiveCamera());
        }

        const nearestOrbitalObject = starSystem.getNearestOrbitalObject(
            this.scene.getActiveControls().getTransform().getAbsolutePosition(),
        );
        const nearestCelestialBody = starSystem.getNearestCelestialBody(
            this.scene.getActiveControls().getTransform().getAbsolutePosition(),
        );

        const spaceship = this.spaceshipControls.getSpaceship();
        const shipDiscoveryScanner = spaceship.getInternals().getDiscoveryScanner();

        if (
            shipDiscoveryScanner !== null &&
            isScannerInRange(
                shipDiscoveryScanner,
                this.scene.getActiveControls().getTransform().getAbsolutePosition(),
                nearestCelestialBody,
            )
        ) {
            const universeId = getUniverseObjectId(nearestCelestialBody.model, starSystem.model);
            const isNewDiscovery = this.player.addVisitedObjectIfNew(universeId);
            if (isNewDiscovery) {
                createNotification(
                    NotificationOrigin.EXPLORATION,
                    NotificationIntent.SUCCESS,
                    i18n.t("notifications:newDiscovery", {
                        objectName: nearestCelestialBody.model.name,
                    }),
                    15_000,
                    this.soundPlayer,
                );
                this.tts.enqueueSay(Speaker.CHARLOTTE, VoiceLine.NEW_DISCOVERY);
                this.onNewDiscovery.notifyObservers(universeId);
            }
        }

        spaceship.setNearestOrbitalObject(nearestOrbitalObject);
        spaceship.setNearestCelestialBody(nearestCelestialBody);

        const warpDrive = spaceship.getInternals().getWarpDrive();
        if (warpDrive !== null && warpDrive.isEnabled()) {
            this.spaceShipLayer.displaySpeed(warpDrive.getThrottle(), spaceship.getSpeed());
        } else {
            this.spaceShipLayer.displaySpeed(spaceship.getThrottle(), spaceship.getSpeed());
        }

        //const currentSystemPosition = getStarGalacticPosition(starSystem.model.coordinates);
        //const nextSystemPosition = this.player.currentItinerary.length > 1 ? getStarGalacticPosition(this.player.currentItinerary[1]) : currentSystemPosition;
        //const distanceLY = Vector3.Distance(currentSystemPosition, nextSystemPosition);

        const target = this.targetCursorLayer.getTarget();

        const distanceLY =
            target !== null
                ? metersToLightYears(
                      Vector3.Distance(
                          this.spaceshipControls.getTransform().getAbsolutePosition(),
                          target.getTransform().getAbsolutePosition(),
                      ),
                  )
                : 0;

        const fuelRequiredForJump = warpDrive?.getHyperJumpFuelConsumption(distanceLY) ?? 0;

        this.spaceShipLayer.displayFuel(
            spaceship.getRemainingFuel() / spaceship.getTotalFuelCapacity(),
            fuelRequiredForJump / spaceship.getTotalFuelCapacity(),
        );

        this.characterControls.setClosestWalkableObject(nearestOrbitalObject);
        spaceship.setClosestWalkableObject(nearestOrbitalObject);

        if (
            nearestOrbitalObject.type === OrbitalObjectType.SPACE_STATION ||
            nearestOrbitalObject.type === OrbitalObjectType.SPACE_ELEVATOR
        ) {
            this.spaceshipControls.setClosestLandableFacility(nearestOrbitalObject);
        } else {
            this.spaceshipControls.setClosestLandableFacility(null);
        }

        this.orbitRenderer.update(this.getStarSystem().getReferencePlaneRotation());

        // update missions
        const missionContext: MissionContext = {
            currentSystem: starSystem,
            currentItinerary: this.player.currentItinerary,
            playerPosition: this.scene.getActiveControls().getTransform().getAbsolutePosition(),
            physicsEngine: this.scene.getPhysicsEngine() as PhysicsEngineV2,
        };

        const newlyCompletedMissions: Mission[] = [];
        this.player.currentMissions.forEach((mission) => {
            if (mission.isCompleted()) return;
            mission.update(missionContext);
            if (mission.isCompleted()) {
                this.player.earn(mission.getReward());
                this.tts.enqueueSay(Speaker.CHARLOTTE, VoiceLine.MISSION_COMPLETE);
                newlyCompletedMissions.push(mission);
            }
        });

        this.player.completedMissions.push(...newlyCompletedMissions);
        this.player.currentMissions = this.player.currentMissions.filter((mission) => !mission.isCompleted());

        const stellarObjects = starSystem.getStellarObjects().map((object) => object.getLight());

        // update dynamic materials
        this.assets.materials.butterfly.update(
            stellarObjects,
            this.scene.getActiveControls().getTransform().getAbsolutePosition(),
            deltaSeconds,
        );
        this.assets.materials.butterflyDepth.update(
            stellarObjects,
            this.scene.getActiveControls().getTransform().getAbsolutePosition(),
            deltaSeconds,
        );
        this.assets.materials.grass.update(
            stellarObjects,
            this.scene.getActiveControls().getTransform().getAbsolutePosition(),
            deltaSeconds,
        );
        this.assets.materials.grassDepth.update(
            stellarObjects,
            this.scene.getActiveControls().getTransform().getAbsolutePosition(),
            deltaSeconds,
        );
    }

    public updateAfterRender() {
        if (this._isLoadingSystem) return;

        const starSystem = this.getStarSystem();
        if (this.spaceshipControls === null) throw new Error("Spaceship controls is null");
        if (this.characterControls === null) throw new Error("Character controls is null");

        const activeControls = this.scene.getActiveControls();

        const spaceship = this.spaceshipControls.getSpaceship();

        const missionContext: MissionContext = {
            currentSystem: starSystem,
            currentItinerary: this.player.currentItinerary,
            playerPosition: activeControls.getTransform().getAbsolutePosition(),
            physicsEngine: this.scene.getPhysicsEngine() as PhysicsEngineV2,
        };

        this.spaceShipLayer.update(
            activeControls.getTransform(),
            missionContext,
            this.keyboardLayoutMap,
            this.starSystemDatabase,
        );

        this.targetCursorLayer.update(activeControls.getActiveCamera());
        const targetLandingPad = spaceship.getTargetLandingPad();
        if (
            targetLandingPad !== null &&
            !spaceship.isLanded() &&
            this.targetCursorLayer.getTarget() !== targetLandingPad
        ) {
            this.targetCursorLayer.setTarget(targetLandingPad);
        }

        if (spaceship.isLandedAtFacility() && this.isUiEnabled) {
            this.spaceStationLayer.setVisibility(true);
            const facility = this.spaceshipControls.getClosestLandableFacility();
            this.getStarSystem()
                .getOrbitalFacilities()
                .find((spaceStation) => {
                    if (spaceStation === facility) {
                        this.spaceStationLayer.setStation(
                            spaceStation.model,
                            starSystem
                                .getOrbitalObjects()
                                .map((object) => object.model)
                                .filter((object) => spaceStation.model.orbit.parentIds.includes(object.id)),
                            this.player,
                        );
                        return true;
                    }
                    return false;
                });
        } else {
            this.spaceStationLayer.setVisibility(false);
        }

        this.targetCursorLayer.setEnabled(this.isUiEnabled && !spaceship.isLandedAtFacility());
        this.spaceShipLayer.setVisibility(
            this.isUiEnabled && activeControls === this.spaceshipControls && !spaceship.isLandedAtFacility(),
        );
    }

    /**
     * Returns the spaceship controls
     * @returns the spaceship controls
     * @throws Error if the spaceship controls is null (the assets are not initialized, you must call `initAssets` before)
     */
    public getSpaceshipControls() {
        if (this.spaceshipControls === null) throw new Error("Spaceship controls is null");
        return this.spaceshipControls;
    }

    /**
     * Returns the character controls
     * @returns the character controls
     * @throws Error if the character controls is null (the assets are not initialized, you must call `initAssets` before)
     */
    public getCharacterControls() {
        if (this.characterControls === null) throw new Error("Character controls is null");
        return this.characterControls;
    }

    /**
     * Returns the default controls
     * @returns the default controls
     * @throws Error if the default controls is null (the assets are not initialized, you must call `initAssets` before)
     */
    public getDefaultControls() {
        if (this.defaultControls === null) throw new Error("Default controls is null");
        return this.defaultControls;
    }

    /**
     * Switches the active controller to the spaceship controls
     */
    public async switchToSpaceshipControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        this.spaceShipLayer.setVisibility(this.isUiEnabled);

        characterControls.getTransform().setEnabled(false);
        CharacterInputs.setEnabled(false);
        await this.scene.setActiveControls(shipControls);
        setRotationQuaternion(
            shipControls.getTransform(),
            getRotationQuaternion(defaultControls.getTransform()).clone(),
        );

        shipControls.syncCameraTransform();

        shipControls.getSpaceship().setEnabled(true, this.havokPlugin);
        SpaceShipControlsInputs.setEnabled(true);
    }

    /**
     * Switches the active controller to the character controls
     */
    public async switchToCharacterControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        this.spaceShipLayer.setVisibility(false);

        characterControls.getTransform().setEnabled(true);
        CharacterInputs.setEnabled(true);
        characterControls.getTransform().setAbsolutePosition(defaultControls.getTransform().absolutePosition);
        await this.scene.setActiveControls(characterControls);
        setRotationQuaternion(
            characterControls.getTransform(),
            getRotationQuaternion(defaultControls.getTransform()).clone(),
        );

        const spaceship = shipControls.getSpaceship();
        spaceship.warpTunnel.setThrottle(0);
        spaceship.setEnabled(false, this.havokPlugin);
        SpaceShipControlsInputs.setEnabled(false);
        this.stopBackgroundSounds();
    }

    /**
     * Switches the active controller to the default controls
     */
    public async switchToDefaultControls(showHelpNotification: boolean) {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        const keyboardLayoutMap = await getGlobalKeyboardLayoutMap();

        this.spaceShipLayer.setVisibility(false);

        characterControls.getTransform().setEnabled(false);
        CharacterInputs.setEnabled(false);

        const spaceship = shipControls.getSpaceship();
        spaceship.warpTunnel.setThrottle(0);
        spaceship.setEnabled(false, this.havokPlugin);
        SpaceShipControlsInputs.setEnabled(false);

        this.stopBackgroundSounds();

        await this.scene.setActiveControls(defaultControls);
        setRotationQuaternion(
            defaultControls.getTransform(),
            getRotationQuaternion(shipControls.getTransform()).clone(),
        );

        if (showHelpNotification) {
            const horizontalKeys = dPadCompositeToString(
                DefaultControlsInputs.map.move.bindings[0]?.control as DPadComposite,
                keyboardLayoutMap,
            );
            const verticalKeys = axisCompositeToString(
                DefaultControlsInputs.map.upDown.bindings[0]?.control as AxisComposite,
                keyboardLayoutMap,
            );
            const keys = horizontalKeys.concat(verticalKeys);
            createNotification(
                NotificationOrigin.GENERAL,
                NotificationIntent.INFO,
                `Move using ${keys.map((key) => key[1].replace("Key", "")).join(", ")}`,
                20_000,
                this.soundPlayer,
            );
        }
    }

    /**
     * Stops the background sounds of the spaceship
     */
    public stopBackgroundSounds() {
        const spaceship = this.getSpaceshipControls().getSpaceship();
        spaceship.acceleratingWarpDriveSound.setVolume(0);
        spaceship.deceleratingWarpDriveSound.setVolume(0);
        spaceship.thrusterSound.setVolume(0);
    }

    /**
     * Returns the star system
     * @returns the star system
     * @throws Error if the star system is null
     */
    public getStarSystem() {
        if (this.starSystem === null) throw new Error("Star system not initialized");
        return this.starSystem;
    }

    public hideHtmlUI() {
        this.spaceShipLayer.setVisibility(false);
        this.targetCursorLayer.setEnabled(false);
        this.spaceStationLayer.setVisibility(false);
    }

    public setUIEnabled(enabled: boolean) {
        this.isUiEnabled = enabled;
    }

    public setTarget(target: (Transformable & HasBoundingSphere & TypedObject) | null) {
        if (this.targetCursorLayer.getTarget() === target) {
            this.spaceShipLayer.setTarget(null);
            this.targetCursorLayer.setTarget(null);
            this.soundPlayer.playNow(SoundType.TARGET_UNLOCK);
            return;
        }

        if (target === null) return;

        this.spaceShipLayer.setTarget(target.getTransform());
        this.targetCursorLayer.setTarget(target);
        this.soundPlayer.playNow(SoundType.TARGET_LOCK);
    }

    /**
     * Creates a visible target inside the current star system to aim for another star system.
     * This target will display the name of the target system and its distance.
     * @param targetSeed the seed of the target system
     */
    public setSystemAsTarget(targetSeed: StarSystemCoordinates) {
        let target = this.getStarSystem()
            .getSystemTargets()
            .find((systemTarget) => starSystemCoordinatesEquals(systemTarget.systemCoordinates, targetSeed));

        if (target === undefined) {
            const newTarget = this.getStarSystem().addSystemTarget(targetSeed, this.starSystemDatabase);
            if (newTarget !== null) {
                target = newTarget;
                this.targetCursorLayer.addObject(target);
            }
        }

        if (target !== undefined) {
            this.targetCursorLayer.setTarget(target, true);
            this.spaceShipLayer.setTarget(target.getTransform(), true);
        }
    }

    public render() {
        this.scene.render();
    }

    public attachControl() {
        this.scene.attachControl();
    }

    public detachControl() {
        this.scene.detachControl();
        this.hideHtmlUI();
    }

    public getMainScene() {
        return this.scene;
    }
}
