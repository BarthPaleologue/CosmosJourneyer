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

import { HelmetOverlay } from "../ui/helmetOverlay";
import { BodyEditor, EditorVisibility } from "../ui/bodyEditor/bodyEditor";
import { UberScene } from "../uberCore/uberScene";
import { AxisRenderer } from "../orbit/axisRenderer";
import { TargetCursorLayer } from "../ui/targetCursorLayer";
import { Animation } from "@babylonjs/core/Animations/animation";
import { StarSystemController } from "./starSystemController";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
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
import { DefaultControls } from "../defaultControls/defaultControls";
import { CharacterControls } from "../characterControls/characterControls";
import { Assets } from "../assets/assets";
import {
    getForwardDirection,
    getRotationQuaternion,
    setRotationQuaternion,
    translate
} from "../uberCore/transforms/basicTransform";
import { Observable } from "@babylonjs/core/Misc/observable";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";
import { View } from "../utils/view";
import { SystemSeed } from "../utils/systemSeed";
import { StarSector } from "../starmap/starSector";
import { StarMap } from "../starmap/starMap";
import { SystemTarget } from "../utils/systemTarget";
import { StarSystemInputs } from "../inputs/starSystemInputs";
import { createNotification } from "../utils/notification";
import { axisCompositeToString } from "../utils/inputControlsString";
import { SpaceShipControlsInputs } from "../spaceship/spaceShipControlsInputs";
import { AxisComposite } from "@brianchirls/game-input/browser";
import { getMoonSeed, getSpaceStationSeed } from "../planets/common";
import { Planet } from "../architecture/planet";
import { AudioManager } from "../audio/audioManager";
import { AudioMasks } from "../audio/audioMasks";
import { TransformRotationAnimation } from "../uberCore/transforms/animations/rotation";
import { PostProcessManager } from "../postProcesses/postProcessManager";
import { wait } from "../utils/wait";
import { CharacterInputs } from "../characterControls/characterControlsInputs";
import i18n from "../i18n";
import { BodyType } from "../architecture/bodyType";
import { AnomalyType } from "../anomalies/anomalyType";
import { Anomaly } from "../anomalies/anomaly";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Sounds } from "../assets/sounds";
import { Materials } from "../assets/materials";
import { SpaceStation } from "../spacestation/spaceStation";
import { ObjectTargetCursorType } from "../ui/objectTargetCursor";

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
     * The HTML GUI used to display orbital objects cursors and information when targeted.
     */
    readonly targetCursorLayer: TargetCursorLayer;

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

    readonly postProcessManager: PostProcessManager;

    /**
     * Creates an empty star system view with a scene, a gui and a havok plugin
     * To fill it with a star system, use `loadStarSystem` and then `initStarSystem`
     * @param engine The BabylonJS engine
     * @param havokInstance The Havok physics instance
     */
    constructor(engine: AbstractEngine, havokInstance: HavokPhysicsWithBindings) {
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

        StarSystemInputs.map.toggleOverlay.on("complete", () => {
            const enabled = !this.targetCursorLayer.isEnabled();
            if (enabled) Sounds.MENU_HOVER_SOUND.play();
            else Sounds.MENU_HOVER_SOUND.play();
            this.targetCursorLayer.setEnabled(enabled);
            this.helmetOverlay.setVisibility(enabled);
        });

        StarSystemInputs.map.toggleOrbitsAndAxis.on("complete", () => {
            const enabled = !this.orbitRenderer.isVisible();
            if (enabled) Sounds.MENU_HOVER_SOUND.play();
            else Sounds.MENU_HOVER_SOUND.play();
            this.orbitRenderer.setVisibility(enabled);
            this.axisRenderer.setVisibility(enabled);
        });

        StarSystemInputs.map.toggleDebugUi.on("complete", () => {
            this.bodyEditor.setVisibility(this.bodyEditor.getVisibility() === EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
        });

        StarSystemInputs.map.cycleViews.on("complete", () => {
            if (this.scene.getActiveControls() === this.getSpaceshipControls()) {
                this.switchToDefaultControls();
            } else if (this.scene.getActiveControls() === this.getDefaultControls()) {
                this.switchToCharacterControls();
            } else if (this.scene.getActiveControls() === this.getCharacterControls()) {
                this.switchToSpaceshipControls();
            }
        });

        StarSystemInputs.map.setTarget.on("complete", () => {
            const closestObjectToCenter = this.targetCursorLayer.getClosestToScreenCenterOrbitalObject();

            if (this.targetCursorLayer.getTarget() === closestObjectToCenter) {
                this.helmetOverlay.setTarget(null);
                this.targetCursorLayer.setTarget(null);
                Sounds.TARGET_UNLOCK_SOUND.play();
                return;
            }

            if (closestObjectToCenter === null) return;

            this.helmetOverlay.setTarget(closestObjectToCenter.getTransform());
            this.targetCursorLayer.setTarget(closestObjectToCenter);
            Sounds.TARGET_LOCK_SOUND.play();
        });

        StarSystemInputs.map.jumpToSystem.on("complete", async () => {
            if (this.isLoadingSystem) return;
            const target = this.targetCursorLayer.getTarget();
            if (!(target instanceof SystemTarget)) return;

            const shipControls = this.getSpaceshipControls();

            // first, align spaceship with target
            const currentForward = getForwardDirection(shipControls.getTransform());
            const targetForward = target.getTransform().getAbsolutePosition().subtract(shipControls.getTransform().getAbsolutePosition()).normalize();

            const rotationAxis = Vector3.Cross(currentForward, targetForward);
            const rotationAngle = Vector3.GetAngleBetweenVectors(currentForward, targetForward, rotationAxis);

            const rotationAnimation = new TransformRotationAnimation(shipControls.getTransform(), rotationAxis, rotationAngle, rotationAngle * 2);
            await new Promise<void>((resolve) => {
                const observer = this.scene.onBeforePhysicsObservable.add(() => {
                    rotationAnimation.update(this.scene.getEngine().getDeltaTime() / 1000);
                    if (rotationAnimation.isFinished()) {
                        observer.remove();
                        resolve();
                    }
                });
            });

            // then, initiate hyper space jump

            if (!this.spaceshipControls?.spaceship.getWarpDrive().isEnabled()) this.spaceshipControls?.spaceship.enableWarpDrive();
            this.spaceshipControls?.spaceship.hyperSpaceTunnel.setEnabled(true);
            this.spaceshipControls?.spaceship.warpTunnel.getTransform().setEnabled(false);
            this.spaceshipControls?.spaceship.hyperSpaceSound.setTargetVolume(1);
            AudioManager.SetMask(AudioMasks.HYPER_SPACE);
            const observer = this.scene.onBeforeRenderObservable.add(() => {
                const deltaSeconds = this.scene.getEngine().getDeltaTime() / 1000;
                this.spaceshipControls?.spaceship.hyperSpaceTunnel.update(deltaSeconds);
            });

            const systemSeed = target.seed;
            this.isLoadingSystem = true;
            await this.loadStarSystem(new StarSystemController(systemSeed, this.scene), true);
            await this.initStarSystem();

            this.spaceshipControls?.spaceship.hyperSpaceTunnel.setEnabled(false);
            this.spaceshipControls?.spaceship.warpTunnel.getTransform().setEnabled(true);
            this.spaceshipControls?.spaceship.hyperSpaceSound.setTargetVolume(0);
            this.isLoadingSystem = false;
            AudioManager.SetMask(AudioMasks.STAR_SYSTEM_VIEW);
            observer.remove();
            this.targetCursorLayer.setTarget(null);
        });

        StarSystemInputs.map.toggleSpaceShipCharacter.on("complete", () => {
            const characterControls = this.getCharacterControls();
            const shipControls = this.getSpaceshipControls();

            if (this.scene.getActiveControls() === shipControls) {
                console.log("disembark");

                characterControls.getTransform().setEnabled(true);
                CharacterInputs.setEnabled(true);
                characterControls.getTransform().setAbsolutePosition(shipControls.getTransform().absolutePosition);
                translate(characterControls.getTransform(), getForwardDirection(shipControls.getTransform()).scale(10));

                setRotationQuaternion(characterControls.getTransform(), getRotationQuaternion(shipControls.getTransform()).clone());
                SpaceShipControlsInputs.setEnabled(false);

                this.scene.setActiveControls(characterControls);
                this.postProcessManager.rebuild();

                shipControls.spaceship.acceleratingWarpDriveSound.setTargetVolume(0);
                shipControls.spaceship.deceleratingWarpDriveSound.setTargetVolume(0);
            } else if (this.scene.getActiveControls() === characterControls) {
                console.log("embark");

                characterControls.getTransform().setEnabled(false);
                CharacterInputs.setEnabled(false);

                this.scene.setActiveControls(shipControls);
                SpaceShipControlsInputs.setEnabled(true);

                this.postProcessManager.rebuild();

                if (shipControls.spaceship.isLanded()) {
                    const bindings = SpaceShipControlsInputs.map.upDown.bindings;
                    const control = bindings[0].control;
                    if (!(control instanceof AxisComposite)) {
                        throw new Error("Up down is not an axis composite");
                    }
                    createNotification(i18n.t("notifications:howToLiftOff", { bindingsString: axisCompositeToString(control)[1][1] }), 5000);
                }
            }
        });

        this.scene = new UberScene(engine);
        // The right-handed system allows to use directly GLTF models without having to flip them with a transform
        this.scene.useRightHandedSystem = true;
        this.scene.skipPointerMovePicking = true;
        this.scene.autoClear = false;

        this.havokPlugin = new HavokPlugin(true, havokInstance);
        setMaxLinVel(this.havokPlugin, 10000, 10000);
        this.scene.enablePhysics(Vector3.Zero(), this.havokPlugin);

        // small ambient light helps with seeing dark objects. This is unrealistic but I feel it is better.
        const ambientLight = new HemisphericLight("ambientLight", Vector3.Zero(), this.scene);
        ambientLight.intensity = 0.02;

        this.postProcessManager = new PostProcessManager(this.scene);

        // main update loop for the star system
        this.scene.onBeforePhysicsObservable.add(() => {
            const deltaSeconds = engine.getDeltaTime() / 1000;
            this.updateBeforePhysics(deltaSeconds * Settings.TIME_MULTIPLIER);
        });

        this.scene.onBeforeRenderObservable.add(() => {
            const deltaSeconds = (engine.getDeltaTime() * Settings.TIME_MULTIPLIER) / 1000;
            this.updateBeforeRender(deltaSeconds);
        });

        window.addEventListener("resize", () => {
            this.bodyEditor.resize();
        });

        this.bodyEditor.resize();
        this.helmetOverlay.setVisibility(false);

        this.targetCursorLayer = new TargetCursorLayer();
    }

    /**
     * Dispose the previous star system and incrementally loads the new star system. All the assets are instantiated but the system still need to be initialized
     * @param starSystem the star system to be set
     * @param needsGenerating whether the star system needs to be generated or not
     * @param timeOut
     */
    public async loadStarSystem(starSystem: StarSystemController, needsGenerating = true, timeOut = 700) {
        if (this.starSystem !== null) {
            this.chunkForge.reset();
            this.postProcessManager.reset();
            this.starSystem.dispose();
            this.targetCursorLayer.reset();
        }
        this.starSystem = starSystem;

        if (!needsGenerating) return;

        // Incrementally generate the star system

        const offset = 1e10;

        const systemModel = starSystem.model;
        const targetNbStellarObjects = systemModel.getNbStellarObjects();

        // Stellar objects
        let objectIndex = 0;
        for (let i = 0; i < targetNbStellarObjects; i++) {
            console.log("Stellar:", i + 1, "of", targetNbStellarObjects);
            const stellarObject = StarSystemHelper.MakeStellarObject(starSystem);
            stellarObject.getTransform().setAbsolutePosition(new Vector3(offset * ++objectIndex, 0, 0));

            await wait(timeOut);
        }

        const planets: Planet[] = [];

        // Planets
        for (let i = 0; i < systemModel.getNbPlanets(); i++) {
            console.log("Planet:", i + 1, "of", systemModel.getNbPlanets());
            const bodyType = starSystem.model.getBodyTypeOfPlanet(starSystem.planets.length);

            const planet = bodyType === BodyType.TELLURIC_PLANET ? StarSystemHelper.MakeTelluricPlanet(starSystem) : StarSystemHelper.MakeGasPlanet(starSystem);
            planet.getTransform().setAbsolutePosition(new Vector3(offset * ++objectIndex, 0, 0));

            planets.push(planet);

            await wait(timeOut);
        }

        // Satellites
        for (let i = 0; i < planets.length; i++) {
            const planet = planets[i];
            for (let j = 0; j < planet.model.nbMoons; j++) {
                console.log("Satellite:", j + 1, "of", planet.model.nbMoons);
                const satellite = StarSystemHelper.MakeSatellite(starSystem, planet, getMoonSeed(planet.model, j));
                satellite.getTransform().setAbsolutePosition(new Vector3(offset * ++objectIndex, 0, 0));

                await wait(timeOut);
            }
        }

        // Space stations
        for (let i = 0; i < planets.length; i++) {
            const planet = planets[i];
            for (let j = 0; j < planet.model.getNbSpaceStations(); j++) {
                console.log("Space station:", j + 1, "of", planet.model.getNbSpaceStations());
                const seed = getSpaceStationSeed(planet.model, j);
                const spaceStation = StarSystemHelper.MakeSpaceStation(starSystem, seed, planet);
                spaceStation.getTransform().setAbsolutePosition(new Vector3(offset * ++objectIndex, 0, 0));

                await wait(timeOut);
            }
        }

        // Anomalies
        for (let i = 0; i < systemModel.getNbAnomalies(); i++) {
            console.log("Anomaly:", i + 1, "of", systemModel.getNbAnomalies());
            const anomalyType = systemModel.getAnomalyType(i);

            let anomaly: Anomaly;
            switch (anomalyType) {
                case AnomalyType.MANDELBULB:
                    anomaly = StarSystemHelper.MakeMandelbulb(starSystem);
                    break;
                case AnomalyType.JULIA_SET:
                    anomaly = StarSystemHelper.MakeJuliaSet(starSystem);
                    break;
            }

            anomaly.getTransform().setAbsolutePosition(new Vector3(offset * ++objectIndex, 0, 0));

            await wait(timeOut);
        }
    }

    /**
     * Initializes the star system. It initializes the positions of the orbital objects, the UI, the chunk forge and the post processes
     * As it initializes the post processes using `initPostProcesses`, it returns a promise that resolves when the post processes are initialized.
     */
    public initStarSystem(): Promise<void> {
        const starSystem = this.getStarSystem();
        starSystem.initPositions(2, this.chunkForge, this.postProcessManager);
        this.targetCursorLayer.reset();


        starSystem.celestialBodies.forEach((body) => {
            let maxDistance = 0.0;
            if(body.parent !== null && body.parent.parent !== null) {
                // this is a satellite of a planet orbiting a star
                maxDistance = body.getOrbitProperties().radius * 8.0;
            }
            this.targetCursorLayer.addObject(body, ObjectTargetCursorType.CELESTIAL_BODY, body.getBoundingRadius() * 10.0, maxDistance);
        });

        starSystem.spaceStations.forEach((spaceStation) => {
            this.targetCursorLayer.addObject(spaceStation, ObjectTargetCursorType.FACILITY, spaceStation.getBoundingRadius() * 6.0, 0.0);

            spaceStation.getLandingPads().forEach(landingPad => {
               this.targetCursorLayer.addObject(landingPad, ObjectTargetCursorType.LANDING_PAD, landingPad.getBoundingRadius() * 4.0, 2e3);
            });
        });

        this.orbitRenderer.setOrbitalObjects(starSystem.getOrbitalObjects(), this.scene);
        this.axisRenderer.setOrbitalObjects(starSystem.getOrbitalObjects(), this.scene);

        this.helmetOverlay.setTarget(null);

        const firstBody = starSystem.getBodies()[0];
        if (firstBody === undefined) throw new Error("No bodies in star system");

        const activeController = this.scene.getActiveControls();
        let controllerDistanceFactor = 5;
        if (firstBody instanceof BlackHole) controllerDistanceFactor = 7;
        else if (firstBody instanceof NeutronStar) controllerDistanceFactor = 100_000;
        positionNearObjectBrightSide(activeController, firstBody, starSystem, controllerDistanceFactor);

        const initPostProcessesPromise = starSystem.initPostProcesses(this.postProcessManager);

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
    public async initAssets() {
        await Assets.Init(this.scene);

        const maxZ = Settings.EARTH_RADIUS * 1e5;

        this.defaultControls = new DefaultControls(this.scene);
        this.defaultControls.speed = 0.2 * Settings.EARTH_RADIUS;
        this.defaultControls.getActiveCameras().forEach((camera) => (camera.maxZ = maxZ));

        this.spaceshipControls = new ShipControls(this.scene);
        this.spaceshipControls.getActiveCameras().forEach((camera) => (camera.maxZ = maxZ));

        this.characterControls = new CharacterControls(this.scene);
        this.characterControls.getTransform().setEnabled(false);
        this.characterControls.getActiveCameras().forEach((camera) => (camera.maxZ = maxZ));

        this.scene.setActiveControls(this.spaceshipControls);
    }

    /**
     * Updates the system view. It updates the underlying star system, the UI, the chunk forge and the controls
     * @param deltaSeconds the time elapsed since the last update in seconds
     */
    public updateBeforePhysics(deltaSeconds: number) {
        if (this.isLoadingSystem) return;

        const starSystem = this.getStarSystem();

        this.chunkForge.update();

        starSystem.update(deltaSeconds, this.chunkForge, this.postProcessManager);
    }

    public updateBeforeRender(deltaSeconds: number) {
        if (this.isLoadingSystem) return;

        const starSystem = this.getStarSystem();
        if (this.spaceshipControls === null) throw new Error("Spaceship controls is null");
        if (this.characterControls === null) throw new Error("Character controls is null");

        const nearestOrbitalObject = starSystem.getNearestOrbitalObject(this.scene.getActiveControls().getTransform().getAbsolutePosition());
        const nearestCelestialBody = starSystem.getNearestCelestialBody(this.scene.getActiveControls().getTransform().getAbsolutePosition());

        this.spaceshipControls.spaceship.setNearestOrbitalObject(nearestOrbitalObject);
        this.spaceshipControls.spaceship.setNearestCelestialBody(nearestCelestialBody);

        const warpDrive = this.spaceshipControls.spaceship.getWarpDrive();
        if (warpDrive.isEnabled()) {
            this.helmetOverlay.displaySpeed(warpDrive.getThrottle(), this.spaceshipControls.spaceship.getSpeed());
        } else {
            this.helmetOverlay.displaySpeed(this.spaceshipControls.spaceship.getThrottle(), this.spaceshipControls.spaceship.getSpeed());
        }


        this.characterControls.setClosestWalkableObject(nearestOrbitalObject);
        this.spaceshipControls.spaceship.setClosestWalkableObject(nearestOrbitalObject);

        if(nearestOrbitalObject instanceof SpaceStation) {
            this.spaceshipControls.setClosestLandableFacility(nearestOrbitalObject);
        } else {
            this.spaceshipControls.setClosestLandableFacility(null);
        }

        this.bodyEditor.update(nearestCelestialBody, this.postProcessManager, this.scene);

        this.helmetOverlay.update(nearestOrbitalObject, this.scene.getActiveControls().getTransform());

        this.orbitRenderer.update();

        this.targetCursorLayer.update(this.scene.getActiveControls().getActiveCameras()[0]);
        const targetLandingPad = this.getSpaceshipControls().spaceship.getTargetLandingPad();
        if (targetLandingPad !== null) {
            this.targetCursorLayer.setTarget(targetLandingPad);
        }

        Materials.BUTTERFLY_MATERIAL.update(starSystem.stellarObjects, this.scene.getActiveControls().getTransform().getAbsolutePosition(), deltaSeconds);
        Materials.BUTTERFLY_DEPTH_MATERIAL.update(starSystem.stellarObjects, this.scene.getActiveControls().getTransform().getAbsolutePosition(), deltaSeconds);
        Materials.GRASS_MATERIAL.update(starSystem.stellarObjects, this.scene.getActiveControls().getTransform().getAbsolutePosition(), deltaSeconds);
        Materials.GRASS_DEPTH_MATERIAL.update(starSystem.stellarObjects, this.scene.getActiveControls().getTransform().getAbsolutePosition(), deltaSeconds);
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
    public switchToSpaceshipControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        characterControls.getTransform().setEnabled(false);
        CharacterInputs.setEnabled(false);
        this.scene.setActiveControls(shipControls);
        setRotationQuaternion(shipControls.getTransform(), getRotationQuaternion(defaultControls.getTransform()).clone());
        this.postProcessManager.rebuild();

        shipControls.spaceship.setEnabled(true, this.havokPlugin);
        SpaceShipControlsInputs.setEnabled(true);
    }

    /**
     * Switches the active controller to the character controls
     */
    public switchToCharacterControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        characterControls.getTransform().setEnabled(true);
        CharacterInputs.setEnabled(true);
        characterControls.getTransform().setAbsolutePosition(defaultControls.getTransform().absolutePosition);
        this.scene.setActiveControls(characterControls);
        setRotationQuaternion(characterControls.getTransform(), getRotationQuaternion(defaultControls.getTransform()).clone());
        this.postProcessManager.rebuild();

        shipControls.spaceship.warpTunnel.setThrottle(0);
        shipControls.spaceship.setEnabled(false, this.havokPlugin);
        SpaceShipControlsInputs.setEnabled(false);
        this.stopBackgroundSounds();
    }

    /**
     * Switches the active controller to the default controls
     */
    public switchToDefaultControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        characterControls.getTransform().setEnabled(false);
        CharacterInputs.setEnabled(false);

        shipControls.spaceship.warpTunnel.setThrottle(0);
        shipControls.spaceship.setEnabled(false, this.havokPlugin);
        SpaceShipControlsInputs.setEnabled(false);

        this.stopBackgroundSounds();

        this.scene.setActiveControls(defaultControls);
        setRotationQuaternion(defaultControls.getTransform(), getRotationQuaternion(shipControls.getTransform()).clone());
        this.postProcessManager.rebuild();
    }

    /**
     * Stops the background sounds of the spaceship
     */
    public stopBackgroundSounds() {
        this.spaceshipControls?.spaceship.acceleratingWarpDriveSound.setTargetVolume(0);
        this.spaceshipControls?.spaceship.deceleratingWarpDriveSound.setTargetVolume(0);
        this.spaceshipControls?.spaceship.thrusterSound.setTargetVolume(0);
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
        this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
        this.helmetOverlay.setVisibility(false);
    }

    public showHtmlUI() {
        this.helmetOverlay.setVisibility(true);
        this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
    }

    public unZoom(callback: () => void) {
        const activeControls = this.scene.getActiveControls();
        if (activeControls !== this.getSpaceshipControls()) {
            callback();
            return;
        }
        activeControls.getActiveCameras().forEach((camera) => (camera.animations = [StarSystemView.UN_ZOOM_ANIMATION]));
        this.scene.beginAnimation(this.scene.getActiveControls().getActiveCameras(), 0, 60, false, 2.0, () => {
            this.scene
                .getActiveControls()
                .getActiveCameras()
                .forEach((camera) => (camera.animations = []));
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
    public setSystemAsTarget(targetSeed: SystemSeed) {
        const currentSystem = this.getStarSystem();
        const currentSeed = currentSystem.model.seed;

        const currentSystemStarSector = new StarSector(new Vector3(currentSeed.starSectorX, currentSeed.starSectorY, currentSeed.starSectorZ));

        const targetSystemStarSector = new StarSector(new Vector3(targetSeed.starSectorX, targetSeed.starSectorY, targetSeed.starSectorZ));

        const currentSystemUniversePosition = currentSystemStarSector.getPositionOfStar(currentSeed.index);
        const targetSystemUniversePosition = targetSystemStarSector.getPositionOfStar(targetSeed.index);

        const direction = targetSystemUniversePosition.subtract(currentSystemUniversePosition).normalize();
        Vector3.TransformCoordinatesToRef(direction, currentSystem.starFieldBox.getRotationMatrix(), direction);

        const distance = StarMap.StarMapDistanceToLy(Vector3.Distance(currentSystemUniversePosition, targetSystemUniversePosition));

        const target = currentSystem.addSystemTarget(targetSeed, direction, distance);
        this.targetCursorLayer.addObject(target, ObjectTargetCursorType.CELESTIAL_BODY, 0, 0);
        this.targetCursorLayer.setTarget(target);
        this.helmetOverlay.setTarget(target.getTransform());
    }

    public render() {
        this.scene.render();
    }

    public attachControl() {
        this.scene.attachControl();
    }

    public detachControl() {
        this.scene.detachControl();
    }

    public getMainScene() {
        return this.scene;
    }
}
