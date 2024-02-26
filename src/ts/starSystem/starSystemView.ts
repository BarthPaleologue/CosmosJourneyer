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

import { HelmetOverlay } from "../ui/helmetOverlay";
import { BodyEditor, EditorVisibility } from "../ui/bodyEditor/bodyEditor";
import { UberScene } from "../uberCore/uberScene";
import { AxisRenderer } from "../orbit/axisRenderer";
import { SystemUI } from "../ui/systemUI";
import { Animation } from "@babylonjs/core/Animations/animation";
import { StarSystemController } from "./starSystemController";
import { Engine } from "@babylonjs/core/Engines/engine";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { ScenePerformancePriority } from "@babylonjs/core/scene";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Vector3 } from "@babylonjs/core/Maths/math";
import { Settings } from "../settings";
import { StarSystemHelper } from "./starSystemHelper";
import { positionNearObjectBrightSide } from "../utils/positionNearObject";
import { ShipControls } from "../spaceship/shipControls";
import { OrbitRenderer } from "../orbit/orbitRenderer";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { ChunkForgeWorkers } from "../planets/telluricPlanet/terrain/chunks/chunkForgeWorkers";
import "@babylonjs/core/Loading/loadingScreen";
import { setMaxLinVel } from "../utils/havok";
import { HavokPhysicsWithBindings } from "@babylonjs/havok";
import { ChunkForge } from "../planets/telluricPlanet/terrain/chunks/chunkForge";
import { DefaultControls } from "../defaultController/defaultControls";
import { CharacterControls } from "../spacelegs/characterControls";
import { Assets } from "../assets";
import { getRotationQuaternion, setRotationQuaternion } from "../uberCore/transforms/basicTransform";
import { Observable } from "@babylonjs/core/Misc/observable";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { View } from "../utils/view";
import { syncCamera } from "../utils/cameraSyncing";
import { SystemSeed } from "../utils/systemSeed";
import { StarSector } from "../starmap/starSector";
import { StarMap } from "../starmap/starMap";
import { SystemTarget } from "../utils/systemTarget";

/**
 * The star system view is the part of Cosmos Journeyer responsible to display the current star system, along with the
 * player's spaceship, character and GUI. It also handles the loading of the star system and its initialization.
 * While the player may travel to another star system, the star system view stays the same, only the star system controller changes.
 */
export class StarSystemView implements View {
    /**
     * The HTML UI responsible for the name of the closest orbital object, the velocity of the spaceship and the target helper radar.
     */
    readonly helmetOverlay: HelmetOverlay;

    /**
     * A debug HTML UI to change the properties of the closest celestial body
     */
    readonly bodyEditor: BodyEditor;

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
    private readonly orbitRenderer: OrbitRenderer = new OrbitRenderer();

    /**
     * A debug helper to display the axes of the orbital objects
     * @private
     */
    private readonly axisRenderer: AxisRenderer = new AxisRenderer();

    /**
     * The GPU accelerated GUI used to display orbital objects overlays and information when targeted.
     */
    readonly ui: SystemUI;

    /**
     * An animation to unzoom the camera when opening the star map
     * @private
     */
    private static readonly UN_ZOOM_ANIMATION = new Animation("unZoom", "radius", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    /**
     * The controller of the current star system. This controller is unique per star system and is destroyed when the star system is changed.
     * @private
     */
    private starSystem: StarSystemController | null = null;

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
     * Whether the star system is currently loading or not
     * @private
     */
    private isLoadingSystem = false;

    /**
     * Creates an empty star system view with a scene, a gui and a havok plugin
     * To fill it with a star system, use `loadStarSystem` and then `initStarSystem`
     * @param engine The BabylonJS engine
     * @param havokInstance The Havok physics instance
     */
    constructor(engine: Engine, havokInstance: HavokPhysicsWithBindings) {
        this.helmetOverlay = new HelmetOverlay();
        this.bodyEditor = new BodyEditor(EditorVisibility.HIDDEN);

        const canvas = engine.getRenderingCanvas();
        if (canvas === null) throw new Error("Canvas is null");
        this.bodyEditor.setCanvas(canvas);

        StarSystemView.UN_ZOOM_ANIMATION.setKeys([
            {
                frame: 0,
                value: ShipControls.BASE_CAMERA_RADIUS
            },
            {
                frame: 30,
                value: 600
            }
        ]);

        document.addEventListener("keydown", async (e) => {
            if (e.key === "o") {
                const enabled = !this.ui.isEnabled();
                if (enabled) Assets.MENU_HOVER_SOUND.play();
                else Assets.MENU_HOVER_SOUND.play();
                this.ui.setEnabled(enabled);
            }
            if (e.key === "n") {
                const enabled = !this.orbitRenderer.isVisible();
                if (enabled) Assets.MENU_HOVER_SOUND.play();
                else Assets.MENU_HOVER_SOUND.play();
                this.orbitRenderer.setVisibility(enabled);
                this.axisRenderer.setVisibility(enabled);
            }
            if (e.key === "u") this.bodyEditor.setVisibility(this.bodyEditor.getVisibility() === EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
            if (e.key === "b") this.helmetOverlay.setVisibility(!this.helmetOverlay.isVisible());

            if (e.key === "g") {
                if (this.scene.getActiveController() === this.getSpaceshipControls()) {
                    this.switchToDefaultControls();
                } else if (this.scene.getActiveController() === this.getDefaultControls()) {
                    this.switchToCharacterControls();
                } else if (this.scene.getActiveController() === this.getCharacterControls()) {
                    this.switchToSpaceshipControls();
                }
            }

            if (e.key === " ") {
                const target = this.ui.getTarget();
                if (target instanceof SystemTarget) {
                    this.isLoadingSystem = true;
                    this.spaceshipControls?.spaceship.hyperSpaceTunnel.setEnabled(true);
                    const systemSeed = target.seed;
                    await this.loadStarSystem(new StarSystemController(systemSeed, this.scene), true);
                    await this.initStarSystem();
                    this.spaceshipControls?.spaceship.hyperSpaceTunnel.setEnabled(false);
                    this.isLoadingSystem = false;
                }
            }

            if (e.key === "t") {
                const closestObjectToCenter = this.getStarSystem().getClosestToScreenCenterOrbitalObject();

                if (this.ui.getTarget() === closestObjectToCenter) {
                    this.helmetOverlay.setTarget(null);
                    this.ui.setTarget(null);
                    Assets.TARGET_UNLOCK_SOUND.play();
                    return;
                }

                if (closestObjectToCenter === null) return;

                this.helmetOverlay.setTarget(closestObjectToCenter.getTransform());
                this.ui.setTarget(closestObjectToCenter);
                Assets.TARGET_LOCK_SOUND.play();
            }
        });

        this.scene = new UberScene(engine, ScenePerformancePriority.Intermediate);
        this.scene.clearColor = new Color4(0, 0, 0, 0);
        // The right-handed system allows to use directly GLTF models without having to flip them with a transform
        this.scene.useRightHandedSystem = true;

        this.havokPlugin = new HavokPlugin(true, havokInstance);
        setMaxLinVel(this.havokPlugin, 10000, 10000);
        this.scene.enablePhysics(Vector3.Zero(), this.havokPlugin);

        // small ambient light helps with seeing dark objects. This is unrealistic but I feel it is better.
        const ambientLight = new HemisphericLight("ambientLight", Vector3.Zero(), this.scene);
        ambientLight.intensity = 0.3;

        // main update loop for the star system
        this.scene.onBeforePhysicsObservable.add(() => {
            const deltaSeconds = engine.getDeltaTime() / 1000;
            this.update(deltaSeconds * Settings.TIME_MULTIPLIER);
        });

        window.addEventListener("resize", () => {
            this.bodyEditor.resize();
        });

        this.bodyEditor.resize();
        this.helmetOverlay.setVisibility(false);

        this.ui = new SystemUI(engine);
    }

    /**
     * Dispose the previous star system and incrementally loads the new star system. All the assets are instantiated but the system still need to be initialized
     * @param starSystem the star system to be set
     * @param needsGenerating whether the star system needs to be generated or not
     */
    async loadStarSystem(starSystem: StarSystemController, needsGenerating = true) {
        if (this.starSystem !== null) {
            this.starSystem.dispose();
            this.ui.disposeObjectOverlays();
        }
        this.starSystem = starSystem;

        if (!needsGenerating) return;

        // Incrementally generate the star system

        const systemModel = starSystem.model;
        const targetNbStellarObjects = systemModel.getNbStellarObjects();

        // Stellar objects
        const stellarObjectPromises: Promise<void>[] = [];
        for (let i = 0; i < targetNbStellarObjects; i++) {
            stellarObjectPromises.push(
                new Promise<void>((resolve) => {
                    setTimeout(() => {
                        console.log("Stellar:", i + 1, "of", targetNbStellarObjects);
                        StarSystemHelper.MakeStellarObject(starSystem);
                        resolve();
                    }, 1000 * i);
                })
            );
        }

        await Promise.all(stellarObjectPromises);

        // Planets
        const planetPromises: Promise<void>[] = [];
        for (let i = 0; i < systemModel.getNbPlanets(); i++) {
            planetPromises.push(
                new Promise<void>((resolve) => {
                    setTimeout(() => {
                        console.log("Planet:", i + 1, "of", systemModel.getNbPlanets());
                        StarSystemHelper.MakePlanet(starSystem);
                        resolve();
                    }, 1000 * i);
                })
            );
        }

        await Promise.all(planetPromises);
    }

    /**
     * Initializes the star system. It initializes the positions of the orbital objects, the UI, the chunk forge and the post processes
     * As it initializes the post processes using `initPostProcesses`, it returns a promise that resolves when the post processes are initialized.
     * The post processes are initialized when BabylonJS is done loading some textures, therefore this method CANNOT BE AWAITED in the main thread.
     */
    initStarSystem(): Promise<void> {
        const starSystem = this.getStarSystem();
        starSystem.initPositions(2, this.chunkForge);
        this.ui.createObjectOverlays(starSystem.getOrbitalObjects());

        this.orbitRenderer.setOrbitalObjects(starSystem.getOrbitalObjects());
        this.axisRenderer.setObjects(starSystem.getOrbitalObjects());

        this.helmetOverlay.setTarget(null);

        const firstBody = starSystem.getBodies()[0];
        if (firstBody === undefined) throw new Error("No bodies in star system");

        const activeController = this.scene.getActiveController();
        let controllerDistanceFactor = 5;
        if (firstBody instanceof BlackHole) controllerDistanceFactor = 7;
        else if (firstBody instanceof NeutronStar) controllerDistanceFactor = 100_000;
        positionNearObjectBrightSide(activeController, firstBody, starSystem, controllerDistanceFactor);

        const initPostProcessesPromise = starSystem.initPostProcesses();

        initPostProcessesPromise.then(() => {
            this.onInitStarSystem.notifyObservers();
            this.scene.getEngine().loadingScreen.hideLoadingUI();
        });

        return initPostProcessesPromise;
    }

    /**
     * Initializes the assets using the scene of the star system view.
     * It then initializes the default controls, the spaceship controls and the character controls with the associated 3D models and cameras.
     * This method must be awaited before doing anything that requires the assets or the controls to be initialized.
     */
    async initAssets() {
        await Assets.Init(this.scene);

        const maxZ = Settings.EARTH_RADIUS * 1e5;

        this.defaultControls = new DefaultControls(this.scene);
        this.defaultControls.speed = 0.2 * Settings.EARTH_RADIUS;
        this.defaultControls.getActiveCamera().maxZ = maxZ;

        this.spaceshipControls = new ShipControls(this.scene);
        this.spaceshipControls.getActiveCamera().maxZ = maxZ;

        this.characterControls = new CharacterControls(this.scene);
        this.characterControls.getTransform().setEnabled(false);
        this.characterControls.getActiveCamera().maxZ = maxZ;

        this.scene.setActiveController(this.spaceshipControls);
    }

    /**
     * Updates the system view. It updates the underlying star system, the UI, the chunk forge and the controls
     * @param deltaSeconds the time elapsed since the last update in seconds
     */
    update(deltaSeconds: number) {
        if (this.isLoadingSystem) return;

        const starSystem = this.getStarSystem();

        this.chunkForge.update();

        starSystem.update(deltaSeconds, this.chunkForge);

        if (this.spaceshipControls === null) throw new Error("Spaceship controls is null");
        if (this.characterControls === null) throw new Error("Character controls is null");

        const shipPosition = this.spaceshipControls.getTransform().getAbsolutePosition();
        const nearestBody = starSystem.getNearestOrbitalObject();
        const distance = nearestBody.getTransform().getAbsolutePosition().subtract(shipPosition).length();
        const radius = nearestBody.getBoundingRadius();
        this.spaceshipControls.spaceship.registerClosestObject(distance, radius);

        const warpDrive = this.spaceshipControls.spaceship.getWarpDrive();
        if (warpDrive.isEnabled()) {
            this.helmetOverlay.displaySpeed(warpDrive.getInternalThrottle(), warpDrive.getTargetThrottle(), this.spaceshipControls.spaceship.getSpeed());
        } else {
            this.helmetOverlay.displaySpeed(this.spaceshipControls.spaceship.getThrottle(), 1, this.spaceshipControls.spaceship.getSpeed());
        }

        this.characterControls.setClosestWalkableObject(nearestBody);
        this.spaceshipControls.spaceship.setClosestWalkableObject(nearestBody);

        this.ui.update(this.scene.getActiveCamera());

        const nearestOrbitalObject = starSystem.getNearestOrbitalObject();
        const nearestCelestialBody = starSystem.getNearestCelestialBody(this.scene.getActiveCamera().globalPosition);

        this.bodyEditor.update(nearestCelestialBody, starSystem.postProcessManager, this.scene);

        this.helmetOverlay.update(nearestOrbitalObject, this.scene.getActiveController().getTransform());

        this.orbitRenderer.update();

        Assets.BUTTERFLY_MATERIAL.update(starSystem.stellarObjects, this.scene.getActiveController().getTransform().getAbsolutePosition(), deltaSeconds);
        Assets.GRASS_MATERIAL.update(starSystem.stellarObjects, this.scene.getActiveController().getTransform().getAbsolutePosition(), deltaSeconds);
    }

    /**
     * Returns the spaceship controls
     * @returns the spaceship controls
     * @throws Error if the spaceship controls is null (the assets are not initialized, you must call `initAssets` before)
     */
    getSpaceshipControls() {
        if (this.spaceshipControls === null) throw new Error("Spaceship controls is null");
        return this.spaceshipControls;
    }

    /**
     * Returns the character controls
     * @returns the character controls
     * @throws Error if the character controls is null (the assets are not initialized, you must call `initAssets` before)
     */
    getCharacterControls() {
        if (this.characterControls === null) throw new Error("Character controls is null");
        return this.characterControls;
    }

    /**
     * Returns the default controls
     * @returns the default controls
     * @throws Error if the default controls is null (the assets are not initialized, you must call `initAssets` before)
     */
    getDefaultControls() {
        if (this.defaultControls === null) throw new Error("Default controls is null");
        return this.defaultControls;
    }

    /**
     * Switches the active controller to the spaceship controls
     */
    switchToSpaceshipControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        characterControls.getTransform().setEnabled(false);
        this.scene.setActiveController(shipControls);
        setRotationQuaternion(shipControls.getTransform(), getRotationQuaternion(defaultControls.getTransform()).clone());
        this.getStarSystem().postProcessManager.rebuild();

        shipControls.spaceship.setEnabled(true, this.havokPlugin);
    }

    /**
     * Switches the active controller to the character controls
     */
    switchToCharacterControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        characterControls.getTransform().setEnabled(true);
        characterControls.getTransform().setAbsolutePosition(defaultControls.getTransform().absolutePosition);
        this.scene.setActiveController(characterControls);
        setRotationQuaternion(characterControls.getTransform(), getRotationQuaternion(defaultControls.getTransform()).clone());
        this.getStarSystem().postProcessManager.rebuild();

        shipControls.spaceship.warpTunnel.setThrottle(0);
        shipControls.spaceship.setEnabled(false, this.havokPlugin);
        this.stopBackgroundSounds();
    }

    /**
     * Switches the active controller to the default controls
     */
    switchToDefaultControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        characterControls.getTransform().setEnabled(false);
        shipControls.spaceship.warpTunnel.setThrottle(0);
        shipControls.spaceship.setEnabled(false, this.havokPlugin);
        this.stopBackgroundSounds();

        this.scene.setActiveController(defaultControls);
        setRotationQuaternion(defaultControls.getTransform(), getRotationQuaternion(shipControls.getTransform()).clone());
        this.getStarSystem().postProcessManager.rebuild();
    }

    stopBackgroundSounds() {
        this.spaceshipControls?.spaceship.acceleratingWarpDriveSound.setTargetVolume(0);
        this.spaceshipControls?.spaceship.deceleratingWarpDriveSound.setTargetVolume(0);
        this.spaceshipControls?.spaceship.thrusterSound.setTargetVolume(0);
    }

    /**
     * Returns the star system
     * @returns the star system
     * @throws Error if the star system is null
     */
    getStarSystem() {
        if (this.starSystem === null) throw new Error("Star system not initialized");
        return this.starSystem;
    }

    hideHtmlUI() {
        this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
        this.helmetOverlay.setVisibility(false);
    }

    showHtmlUI() {
        this.helmetOverlay.setVisibility(true);
        this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
    }

    unZoom(callback: () => void) {
        const activeControls = this.scene.getActiveController();
        if (activeControls !== this.getSpaceshipControls()) {
            callback();
            return;
        }
        activeControls.getActiveCamera().animations = [StarSystemView.UN_ZOOM_ANIMATION];
        this.scene.beginAnimation(this.scene.getActiveController().getActiveCamera(), 0, 60, false, 2.0, () => {
            this.scene.getActiveController().getActiveCamera().animations = [];
            this.hideHtmlUI();
            callback();
            this.scene.onAfterRenderObservable.addOnce(() => {
                (activeControls as ShipControls).thirdPersonCamera.radius = 30;
            });
        });
    }

    /**
     * Creates a visible target inside the current star system to aim for another star system.
     * This target will display the name of the target system and its distance.
     * @param targetSeed the seed of the target system
     */
    setSystemAsTarget(targetSeed: SystemSeed) {
        const currentSystem = this.getStarSystem();
        const currentSeed = currentSystem.model.seed;

        const currentSystemStarSector = new StarSector(new Vector3(currentSeed.starSectorX, currentSeed.starSectorY, currentSeed.starSectorZ));

        const targetSystemStarSector = new StarSector(new Vector3(targetSeed.starSectorX, targetSeed.starSectorY, targetSeed.starSectorZ));

        const currentSystemUniversePosition = currentSystemStarSector.getPositionOfStar(currentSeed.index);
        const targetSystemUniversePosition = targetSystemStarSector.getPositionOfStar(targetSeed.index);

        const direction = targetSystemUniversePosition.subtract(currentSystemUniversePosition).normalize();
        direction.applyRotationQuaternionInPlace(currentSystem.universeRotation);

        const distance = StarMap.StarMapDistanceToLy(Vector3.Distance(currentSystemUniversePosition, targetSystemUniversePosition));

        const target = currentSystem.addSystemTarget(targetSeed, direction, distance);
        this.ui.addObjectOverlay(target);
        this.ui.setTarget(target);
        this.helmetOverlay.setTarget(target.getTransform());
    }

    public render() {
        this.scene.render();

        syncCamera(this.scene.getActiveCamera(), this.ui.camera);
        this.ui.scene.render();
    }


    public attachControl() {
        this.scene.attachControl();
        this.ui.scene.attachControl();
    }

    public detachControl() {
        this.scene.detachControl();
        this.ui.scene.detachControl();
    }

    public getMainScene() {
        return this.scene;
    }
}
