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

import "@babylonjs/core/Lights/Clustered/clusteredLightingSceneComponent";
import "@babylonjs/core/Loading/loadingScreen";

import { type AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Quaternion, Space, Vector3 } from "@babylonjs/core/Maths/math";
import { Observable } from "@babylonjs/core/Misc/observable";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { type PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { AxisComposite } from "@brianchirls/game-input/browser";
import type DPadComposite from "@brianchirls/game-input/controls/DPadComposite";

import { type EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { ItinerarySchema } from "@/backend/player/serializedPlayer";
import { starSystemCoordinatesEquals, type StarSystemCoordinates } from "@/backend/universe/starSystemCoordinates";
import { type StarSystemModel } from "@/backend/universe/starSystemModel";
import { type UniverseBackend } from "@/backend/universe/universeBackend";
import { getUniverseObjectId, type UniverseObjectId } from "@/backend/universe/universeObjectId";

import { type RenderingAssets } from "@/frontend/assets/renderingAssets";
import { AudioMasks } from "@/frontend/audio/audioMasks";
import { type ISoundPlayer } from "@/frontend/audio/soundPlayer";
import { type ITts } from "@/frontend/audio/tts";
import { CharacterControls } from "@/frontend/controls/characterControls/characterControls";
import { CharacterInputs } from "@/frontend/controls/characterControls/characterControlsInputs";
import { DefaultControls } from "@/frontend/controls/defaultControls/defaultControls";
import { DefaultControlsInputs } from "@/frontend/controls/defaultControls/defaultControlsInputs";
import { wrapVector3 } from "@/frontend/helpers/algebra";
import { TransformRotationAnimation } from "@/frontend/helpers/animations/rotation";
import { getNeighborStarSystemCoordinates } from "@/frontend/helpers/getNeighborStarSystems";
import { axisCompositeToString, dPadCompositeToString } from "@/frontend/helpers/inputControlsString";
import { positionNearObjectBrightSide } from "@/frontend/helpers/positionNearObject";
import { getRotationQuaternion, lookAt, setRotationQuaternion, setUpVector } from "@/frontend/helpers/transform";
import { type UberScene } from "@/frontend/helpers/uberScene";
import { StarSystemInputs } from "@/frontend/inputs/starSystemInputs";
import { type Mission } from "@/frontend/missions/mission";
import { type MissionContext } from "@/frontend/missions/missionContext";
import { PostProcessManager } from "@/frontend/postProcesses/postProcessManager";
import { ShipControls } from "@/frontend/spaceship/shipControls";
import { Spaceship } from "@/frontend/spaceship/spaceship";
import { SpaceShipControlsInputs } from "@/frontend/spaceship/spaceShipControlsInputs";
import { alertModal, radialChoiceModal } from "@/frontend/ui/dialogModal";
import { SpaceShipLayer } from "@/frontend/ui/spaceShipLayer";
import { SpaceStationLayer } from "@/frontend/ui/spaceStation/spaceStationLayer";
import { TargetCursorLayer } from "@/frontend/ui/targetCursorLayer";
import { type HasBoundingSphere } from "@/frontend/universe/architecture/hasBoundingSphere";
import { AxisRenderer } from "@/frontend/universe/axisRenderer";
import { OrbitRenderer } from "@/frontend/universe/orbitRenderer";
import { type ChunkForge } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForge";
import { ChunkForgeWorkers } from "@/frontend/universe/planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";
import { StarSystemController } from "@/frontend/universe/starSystemController";
import { StarSystemLoader } from "@/frontend/universe/starSystemLoader";
import { BlackHole } from "@/frontend/universe/stellarObjects/blackHole/blackHole";
import { NeutronStar } from "@/frontend/universe/stellarObjects/neutronStar/neutronStar";
import { SystemTarget } from "@/frontend/universe/systemTarget";
import { type View } from "@/frontend/view";

import { getGlobalKeyboardLayoutMap } from "@/utils/keyboardAPI";
import { metersToLightYears } from "@/utils/physics/unitConversions";
import { type DeepReadonly } from "@/utils/types";

import i18n from "@/i18n";
import { CollisionMask, Settings } from "@/settings";

import { HumanoidAvatar } from "./controls/characterControls/humanoidAvatar";
import { setCollisionsEnabled } from "./helpers/havok";
import { InteractionSystem } from "./inputs/interaction/interactionSystem";
import { type Player } from "./player/player";
import { isScannerInRange } from "./spaceship/components/discoveryScanner";
import { InteractionLayer } from "./ui/interactionLayer";
import { type INotificationManager } from "./ui/notificationManager";
import { type Transformable } from "./universe/architecture/transformable";
import { type TypedObject } from "./universe/architecture/typedObject";
import { CreateLinesHelper } from "./universe/lineRendering";
import { VehicleControls } from "./vehicle/vehicleControls";
import { VehicleInputs } from "./vehicle/vehicleControlsInputs";
import { createWolfMk2 } from "./vehicle/worlfMk2";

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

    private readonly encyclopaedia: EncyclopaediaGalacticaManager;

    private readonly universeBackend: UniverseBackend;

    /**
     * The BabylonJS scene, upgraded with some helper methods and properties
     */
    readonly scene: UberScene;

    private readonly physicsEngine: PhysicsEngineV2;

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

    private vehicleControls: VehicleControls;

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
    private readonly notificationManager: INotificationManager;

    private readonly interactionSystem: InteractionSystem;
    private readonly interactionLayer: InteractionLayer;

    private readonly assets: RenderingAssets;

    /**
     * Creates an empty star system view with a scene, a gui and a physics engine
     * To fill it with a star system, use `loadStarSystem` and then `initStarSystem`
     * @param scene The UberScene instance
     * @param player The player object shared with the rest of the game
     * @param engine The BabylonJS engine
     * @param physicsEngine The physics engine V2 instance
     * @param encyclopaedia The encyclopaedia manager
     * @param universeBackend The universe backend
     * @param soundPlayer The sound player
     * @param tts The text-to-speech system
     * @param notificationManager The notification manager
     * @param assets The rendering assets
     */
    constructor(
        scene: UberScene,
        player: Player,
        engine: AbstractEngine,
        physicsEngine: PhysicsEngineV2,
        encyclopaedia: EncyclopaediaGalacticaManager,
        universeBackend: UniverseBackend,
        soundPlayer: ISoundPlayer,
        tts: ITts,
        notificationManager: INotificationManager,
        assets: RenderingAssets,
    ) {
        this.player = player;
        this.encyclopaedia = encyclopaedia;
        this.universeBackend = universeBackend;

        this.spaceShipLayer = new SpaceShipLayer(this.player, this.universeBackend, soundPlayer);
        document.body.appendChild(this.spaceShipLayer.root);

        this.scene = scene;
        this.scene.skipPointerMovePicking = true;
        this.scene.autoClear = false;

        this.physicsEngine = physicsEngine;

        this.soundPlayer = soundPlayer;
        this.tts = tts;
        this.notificationManager = notificationManager;
        this.assets = assets;

        this.interactionSystem = new InteractionSystem(CollisionMask.INTERACTIVE, scene, [], async (interactions) => {
            if (interactions.length === 0) {
                return null;
            }

            const hasPointerLock = engine.isPointerLock;
            const activeCamera = scene.activeCamera;
            if (hasPointerLock) {
                activeCamera?.detachControl();
            }
            const choice = await radialChoiceModal(
                interactions,
                (interaction) => interaction.label,
                soundPlayer,
                hasPointerLock ? { useVirtualCursor: true } : undefined,
            );
            if (hasPointerLock) {
                activeCamera?.attachControl(true);
            }
            return choice;
        });

        this.interactionLayer = new InteractionLayer(this.interactionSystem, this.keyboardLayoutMap);
        document.body.appendChild(this.interactionLayer.root);

        this.vehicleControls = new VehicleControls(scene);

        void getGlobalKeyboardLayoutMap().then((keyboardLayoutMap) => {
            this.keyboardLayoutMap = keyboardLayoutMap ?? new Map<string, string>();
        });

        StarSystemInputs.map.toggleUi.on("complete", () => {
            this.isUiEnabled = !this.isUiEnabled;
            this.notificationManager.setVisible(this.isUiEnabled);
            this.soundPlayer.playNow("click");
        });

        StarSystemInputs.map.toggleOrbitsAndAxis.on("complete", () => {
            const enabled = !this.orbitRenderer.isVisible();
            if (enabled) this.soundPlayer.playNow("enable_orbit_display");
            else this.soundPlayer.playNow("disable_orbit_display");
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
                this.universeBackend.getSystemGalacticPosition(this.getStarSystem().model.coordinates),
            );
            const targetSystemPosition = wrapVector3(
                this.universeBackend.getSystemGalacticPosition(target.systemCoordinates),
            );

            const distanceLY = Vector3.Distance(currentSystemPosition, targetSystemPosition);

            const fuelForJump = warpDrive.getHyperJumpFuelConsumption(distanceLY);

            if (spaceship.getRemainingFuel() < fuelForJump) {
                this.notificationManager.create("spaceship", "error", i18n.t("notifications:notEnoughFuel"), 5000);
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
                const observer = this.scene.onBeforeRenderObservable.add(() => {
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
            spaceship.soundInstances.hyperSpace.setVolume(0.5);
            soundPlayer.setInstanceMask(AudioMasks.HYPER_SPACE);
            const observer = this.scene.onBeforeRenderObservable.add(() => {
                const deltaSeconds = this.scene.getEngine().getDeltaTime() / 1000;
                spaceship.hyperSpaceTunnel.update(deltaSeconds);
                spaceship.warpTunnel.update(deltaSeconds);
            });

            spaceship.burnFuel(fuelForJump);

            const starSystemCoordinates = target.systemCoordinates;
            const systemModel = this.universeBackend.getSystemModelFromCoordinates(starSystemCoordinates);
            if (systemModel === null) {
                throw new Error("System model not found for coordinates generated by getNeighborStarSystemCoordinates");
            }
            await this.loadStarSystem(systemModel);
            this.initStarSystem(Date.now() / 1000);

            spaceship.hyperSpaceTunnel.setEnabled(false);
            spaceship.warpTunnel.getTransform().setEnabled(true);
            spaceship.soundInstances.hyperSpace.setVolume(0);

            spaceship.idleThrottle();

            soundPlayer.setInstanceMask(AudioMasks.STAR_SYSTEM_VIEW);
            observer.remove();
            this.jumpLock = false;

            this.onAfterJump.notifyObservers();
        });

        StarSystemInputs.map.toggleSpaceShipCharacter.on("complete", async () => {
            const characterControls = this.getCharacterControls();
            const shipControls = this.getSpaceshipControls();
            const spaceship = shipControls.getSpaceship();

            if (this.scene.getActiveControls() === shipControls) {
                setCollisionsEnabled(characterControls.avatar.aggregate, true);
                characterControls.getTransform().setEnabled(true);
                CharacterInputs.setEnabled(true);

                const shipPosition = spaceship.getTransform().getAbsolutePosition();
                const nearestPlanet = this.getStarSystem().getNearestCelestialBody(shipPosition);

                const shipForward = shipControls.getTransform().forward;

                const up = shipPosition.subtract(nearestPlanet.getTransform().getAbsolutePosition()).normalize();

                const left = Vector3.Cross(Vector3.Up(), up).normalize();

                const desiredSpawnPosition = shipPosition.add(shipForward.scale(20)).add(left.scale(10));

                // make sure character spawns above ground
                const raycastResult = new PhysicsRaycastResult();
                this.physicsEngine.raycastToRef(
                    desiredSpawnPosition.add(up.scale(200)),
                    desiredSpawnPosition.add(up.scale(-200)),
                    raycastResult,
                    {
                        collideWith: CollisionMask.ENVIRONMENT & ~CollisionMask.AVATARS,
                    },
                );

                if (raycastResult.hasHit) {
                    desiredSpawnPosition.copyFrom(
                        raycastResult.hitPointWorld.add(raycastResult.hitNormalWorld.scale(1.0)),
                    );
                }

                characterControls.getTransform().setAbsolutePosition(desiredSpawnPosition);
                characterControls.avatar.aggregate.body.setLinearVelocity(Vector3.Zero());

                lookAt(characterControls.getTransform(), shipPosition, scene.useRightHandedSystem);
                characterControls.getTransform().rotate(Vector3.Up(), Math.PI, Space.LOCAL);

                SpaceShipControlsInputs.setEnabled(false);
                this.spaceShipLayer.setVisibility(false);

                await this.scene.setActiveControls(characterControls);

                spaceship.soundInstances.acceleratingWarpDrive.setVolume(0);
                spaceship.soundInstances.deceleratingWarpDrive.setVolume(0);

                const spawnPosition = shipPosition.add(up.scale(10).add(left.scale(20)));
                const spawnRotation = Quaternion.FromUnitVectorsToRef(Vector3.UpReadOnly, up, new Quaternion());

                const roverResult = createWolfMk2(this.assets, this.scene, spawnPosition, spawnRotation);
                if (!roverResult.success) {
                    throw new Error("The rover had a stroke");
                }

                const rover = roverResult.value;
                this.vehicleControls.setVehicle(rover);

                this.interactionSystem.register({
                    getPhysicsAggregate: () => rover.frame,
                    getInteractions: () => [
                        {
                            label: i18n.t("interactions:enterVehicle", { vehicle: "Wolf Mk2" }),
                            perform: async () => {
                                await this.switchToVehicleControls();
                            },
                        },
                    ],
                });

                for (const door of rover.doors) {
                    this.interactionSystem.register(door);
                }
            } else if (this.scene.getActiveControls() === this.vehicleControls) {
                characterControls.getTransform().setEnabled(true);
                CharacterInputs.setEnabled(true);
                VehicleInputs.setEnabled(false);

                const vehiclePosition = this.vehicleControls.getTransform().getAbsolutePosition();

                characterControls
                    .getTransform()
                    .setAbsolutePosition(vehiclePosition.add(this.vehicleControls.getTransform().forward.scale(10)));

                await this.scene.setActiveControls(characterControls);
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

        this.scene.onBeforeRenderObservable.add(() => {
            const deltaSeconds = (engine.getDeltaTime() * Settings.TIME_MULTIPLIER) / 1000;
            this.updateBeforeRender(deltaSeconds);
        });

        this.spaceShipLayer.setVisibility(false);

        this.spaceStationLayer = new SpaceStationLayer(
            this.player,
            this.encyclopaedia,
            this.universeBackend,
            this.soundPlayer,
            this.notificationManager,
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
            this.spaceshipControls?.setClosestLandableFacility(null);
            this.chunkForge.reset();
            this.postProcessManager.reset();
            this.starSystem.dispose();
            this.targetCursorLayer.reset();
            this.spaceStationLayer.reset();
        }

        this.starSystem = await StarSystemController.CreateAsync(starSystemModel, this.loader, this.assets, this.scene);

        return this.starSystem;
    }

    /**
     * Initializes the star system. It initializes the positions of the orbital objects, the UI, the chunk forge and the post processes
     * As it initializes the post processes using `initPostProcesses`, it returns a promise that resolves when the post processes are initialized.
     */
    public initStarSystem(timestampSeconds: number): void {
        const starSystem = this.getStarSystem();
        starSystem.initPositions(2, this.chunkForge, timestampSeconds);
        this.targetCursorLayer.reset();

        this.postProcessManager.addCelestialBodies(starSystem.getCelestialBodies(), starSystem.getStellarObjects(), [
            starSystem.starFieldBox.mesh,
        ]);

        const celestialBodies = starSystem.getCelestialBodies();
        const spaceStations = starSystem.getOrbitalFacilities();

        celestialBodies.forEach((body) => {
            this.targetCursorLayer.addObject(body);
        });

        for (const spaceStation of spaceStations) {
            this.targetCursorLayer.addObject(spaceStation);

            spaceStation.getSubTargets().forEach((landingPad) => {
                this.targetCursorLayer.addObject(landingPad);
            });
        }

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
                this.universeBackend.getSystemGalacticPosition(starSystem.model.coordinates),
            );
            const previousSystemPosition = wrapVector3(this.universeBackend.getSystemGalacticPosition(previousSystem));

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

            // look at the first body
            lookAt(
                activeControls.getTransform(),
                firstBody.getTransform().getAbsolutePosition(),
                this.scene.useRightHandedSystem,
            );
        }

        const currentSpaceship = this.spaceshipControls?.getSpaceship();
        const currentJumpRange = currentSpaceship?.getInternals().getWarpDrive()?.rangeLY ?? 0;

        if (currentSpaceship !== undefined) {
            this.targetCursorLayer.addObject(currentSpaceship);
        }

        for (const neighbor of getNeighborStarSystemCoordinates(
            starSystem.model.coordinates,
            Math.min(currentJumpRange, Settings.VISIBLE_NEIGHBORHOOD_MAX_RADIUS_LY),
            this.universeBackend,
        )) {
            const systemTarget = this.getStarSystem().addSystemTarget(neighbor.coordinates, this.universeBackend);
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

        this.ensureCurrentSystemInHistory();
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

        this.vehicleControls.getCameras().forEach((camera) => (camera.maxZ = maxZ));

        const spaceshipSerialized = this.player.serializedSpaceships.shift();
        if (spaceshipSerialized === undefined) throw new Error("No spaceship serialized in player");

        const spaceship = await Spaceship.Deserialize(
            spaceshipSerialized,
            this.player.spareSpaceshipComponents,
            this.scene,
            this.assets,
            this.soundPlayer,
        );
        this.player.instancedSpaceships.push(spaceship);

        this.targetCursorLayer.addObject(spaceship);

        this.interactionSystem.register({
            getPhysicsAggregate: () => spaceship.aggregate,
            getInteractions: () => {
                return [
                    {
                        label: i18n.t("interactions:pilot"),
                        perform: async () => {
                            const shipControls = this.getSpaceshipControls();
                            const characterControls = this.getCharacterControls();

                            characterControls.getTransform().setEnabled(false);
                            CharacterInputs.setEnabled(false);

                            this.vehicleControls.getVehicle()?.dispose();
                            this.vehicleControls.setVehicle(null);

                            await this.scene.setActiveControls(shipControls);
                            SpaceShipControlsInputs.setEnabled(true);
                            this.spaceShipLayer.setVisibility(true);

                            if (spaceship.isLanded()) {
                                const bindings = SpaceShipControlsInputs.map.upDown.bindings;
                                const control = bindings[0]?.control;
                                if (!(control instanceof AxisComposite)) {
                                    throw new Error("Up down is not an axis composite");
                                }
                                this.notificationManager.create(
                                    "spaceship",
                                    "info",
                                    i18n.t("notifications:howToLiftOff", {
                                        bindingsString: axisCompositeToString(control, this.keyboardLayoutMap)[1]?.[1],
                                    }),
                                    5000,
                                );
                            }
                        },
                    },
                ];
            },
        });

        if (this.spaceshipControls === null) {
            this.spaceshipControls = new ShipControls(
                spaceship,
                this.scene,
                this.soundPlayer,
                this.tts,
                this.notificationManager,
            );
            this.spaceshipControls.getCameras().forEach((camera) => (camera.maxZ = maxZ));
        } else {
            const oldSpaceship = this.spaceshipControls.getSpaceship();
            this.spaceshipControls.reset();
            this.spaceshipControls.setSpaceship(spaceship);
            oldSpaceship.dispose(this.soundPlayer);
        }

        if (this.characterControls === null) {
            const humanoidInstance = this.assets.objects.humanoids.placeholder.spawn();
            if (humanoidInstance.success) {
                const humanoidAvatar = new HumanoidAvatar(humanoidInstance.value, this.physicsEngine, this.scene);
                setCollisionsEnabled(humanoidAvatar.aggregate, false);
                this.characterControls = new CharacterControls(humanoidAvatar, this.scene);
                this.characterControls.getTransform().setEnabled(false);
                this.characterControls.getCameras().forEach((camera) => (camera.maxZ = maxZ));
                this.interactionSystem.setEnabledForCamera(this.characterControls.firstPersonCamera, true);
            } else {
                await alertModal(humanoidInstance.error, this.soundPlayer);
            }
        }

        await this.scene.setActiveControls(this.spaceshipControls);
    }

    private ensureCurrentSystemInHistory(): void {
        const currentCoordinates = this.getStarSystem().model.coordinates;
        const lastVisited = this.player.visitedSystemHistory.at(-1);
        if (lastVisited === undefined) {
            this.player.visitedSystemHistory.push(currentCoordinates);
            return;
        }
        if (!starSystemCoordinatesEquals(lastVisited, currentCoordinates)) {
            this.player.visitedSystemHistory.push(currentCoordinates);
        }
    }

    public isJumpingBetweenSystems() {
        return this.jumpLock;
    }

    public isLoadingSystem() {
        return this._isLoadingSystem;
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

        const lastCharacterGravity =
            starSystem.gravitySystem.getLastComputedForce(this.characterControls.avatar.aggregate.body) ?? Vector3.Up();
        setUpVector(this.characterControls.avatar.getTransform(), lastCharacterGravity.normalize().negateInPlace());

        const activeControls = this.scene.getActiveControls();

        this.chunkForge.update(this.assets);

        starSystem.update(deltaSeconds, this.chunkForge);

        const nearestOrbitalObject = starSystem.getNearestOrbitalObject(
            activeControls.getTransform().getAbsolutePosition(),
        );
        const nearestCelestialBody = starSystem.getNearestCelestialBody(
            activeControls.getTransform().getAbsolutePosition(),
        );

        this.postProcessManager.setCelestialBody(nearestCelestialBody);
        this.postProcessManager.update(deltaSeconds);

        const spaceship = this.spaceshipControls.getSpaceship();
        spaceship.setNearestOrbitalObject(nearestOrbitalObject);
        spaceship.setNearestCelestialBody(nearestCelestialBody);
        spaceship.setClosestWalkableObject(nearestCelestialBody);

        if (nearestOrbitalObject.type === "spaceStation" || nearestOrbitalObject.type === "spaceElevator") {
            this.spaceshipControls.setClosestLandableFacility(nearestOrbitalObject);
        } else {
            this.spaceshipControls.setClosestLandableFacility(null);
        }

        const shipDiscoveryScanner = spaceship.getInternals().getDiscoveryScanner();
        if (
            shipDiscoveryScanner !== null &&
            isScannerInRange(shipDiscoveryScanner, spaceship.getTransform().getAbsolutePosition(), nearestCelestialBody)
        ) {
            const universeId = getUniverseObjectId(nearestCelestialBody.model, starSystem.model);
            const isNewDiscovery = this.player.addVisitedObjectIfNew(universeId);
            if (isNewDiscovery) {
                this.notificationManager.create(
                    "exploration",
                    "success",
                    i18n.t("notifications:newDiscovery", {
                        objectName: nearestCelestialBody.model.name,
                    }),
                    15_000,
                );
                this.tts.enqueueSay("Charlotte", "new_discovery");
                this.onNewDiscovery.notifyObservers(universeId);
            }
        }

        this.spaceShipLayer.displaySpeed(spaceship.getThrottle(), spaceship.getSpeed());

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

        const warpDrive = spaceship.getInternals().getWarpDrive();
        const fuelRequiredForJump = warpDrive?.getHyperJumpFuelConsumption(distanceLY) ?? 0;

        this.spaceShipLayer.displayFuel(
            spaceship.getRemainingFuel() / spaceship.getTotalFuelCapacity(),
            fuelRequiredForJump / spaceship.getTotalFuelCapacity(),
        );

        const cameraPosition = this.scene.getActiveControls().getActiveCamera().getWorldMatrix().getTranslation();
        const upDirection = cameraPosition
            .subtract(nearestCelestialBody.getTransform().getAbsolutePosition())
            .normalize();
        this.vehicleControls.setUpDirection(upDirection);

        this.orbitRenderer.update(this.getStarSystem().getReferencePlaneRotation());

        // update missions
        const missionContext: MissionContext = {
            currentSystem: starSystem,
            currentItinerary: this.player.currentItinerary,
            playerPosition: this.scene.getActiveControls().getTransform().getAbsolutePosition(),
            physicsEngine: this.physicsEngine,
        };

        const newlyCompletedMissions: Mission[] = [];
        this.player.currentMissions.forEach((mission) => {
            if (mission.isCompleted()) return;
            mission.update(missionContext);
            if (mission.isCompleted()) {
                this.player.earn(mission.getReward());
                this.tts.enqueueSay("Charlotte", "mission_complete");
                newlyCompletedMissions.push(mission);
            }
        });

        this.player.completedMissions.push(...newlyCompletedMissions);
        this.player.currentMissions = this.player.currentMissions.filter((mission) => !mission.isCompleted());

        this.interactionSystem.update(deltaSeconds);
        this.interactionLayer.update(deltaSeconds);

        this.spaceShipLayer.update(
            activeControls.getTransform(),
            missionContext,
            this.keyboardLayoutMap,
            this.universeBackend,
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
        VehicleInputs.setEnabled(false);

        const previousControls = this.scene.getActiveControls();
        await this.scene.setActiveControls(shipControls);

        this.scene
            .getActiveControls()
            .getTransform()
            .setAbsolutePosition(previousControls.getActiveCamera().getWorldMatrix().getTranslation());
        setRotationQuaternion(
            shipControls.getTransform(),
            getRotationQuaternion(defaultControls.getTransform()).clone(),
        );

        shipControls.syncCameraTransform();

        SpaceShipControlsInputs.setEnabled(true);
    }

    /**
     * Switches the active controller to the character controls
     */
    public async switchToCharacterControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();

        this.spaceShipLayer.setVisibility(false);

        characterControls.getTransform().setEnabled(true);
        CharacterInputs.setEnabled(true);
        DefaultControlsInputs.setEnabled(false);

        const previousControls = this.scene.getActiveControls();
        await this.scene.setActiveControls(characterControls);

        this.scene
            .getActiveControls()
            .getTransform()
            .setAbsolutePosition(previousControls.getActiveCamera().getWorldMatrix().getTranslation());

        const spaceship = shipControls.getSpaceship();
        spaceship.warpTunnel.setThrottle(0);
        SpaceShipControlsInputs.setEnabled(false);
        VehicleInputs.setEnabled(false);
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
        SpaceShipControlsInputs.setEnabled(false);

        VehicleInputs.setEnabled(false);

        this.stopBackgroundSounds();

        const previousControls = this.scene.getActiveControls();
        await this.scene.setActiveControls(defaultControls);

        DefaultControlsInputs.setEnabled(true);

        this.scene
            .getActiveControls()
            .getTransform()
            .setAbsolutePosition(previousControls.getActiveCamera().getWorldMatrix().getTranslation());

        setRotationQuaternion(
            previousControls.getTransform(),
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
            this.notificationManager.create(
                "general",
                "info",
                `Move using ${keys.map((key) => key[1].replace("Key", "")).join(", ")}`,
                20_000,
            );
        }
    }

    async switchToVehicleControls() {
        this.spaceShipLayer.setVisibility(false);

        SpaceShipControlsInputs.setEnabled(false);
        CharacterInputs.setEnabled(false);
        VehicleInputs.setEnabled(true);

        await this.scene.setActiveControls(this.vehicleControls);
    }

    /**
     * Stops the background sounds of the spaceship
     */
    public stopBackgroundSounds() {
        const spaceship = this.getSpaceshipControls().getSpaceship();
        spaceship.soundInstances.acceleratingWarpDrive.setVolume(0);
        spaceship.soundInstances.deceleratingWarpDrive.setVolume(0);
        spaceship.soundInstances.thruster.setVolume(0);
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
        this.notificationManager.setVisible(enabled);
    }

    public setTarget(target: (Transformable & HasBoundingSphere & TypedObject) | null) {
        if (this.targetCursorLayer.getTarget() === target) {
            this.spaceShipLayer.setTarget(null);
            this.targetCursorLayer.setTarget(null);
            this.soundPlayer.playNow("target_unlock");
            return;
        }

        if (target === null) return;

        this.spaceShipLayer.setTarget(target.getTransform());
        this.targetCursorLayer.setTarget(target);
        this.soundPlayer.playNow("target_lock");
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
            const newTarget = this.getStarSystem().addSystemTarget(targetSeed, this.universeBackend);
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
