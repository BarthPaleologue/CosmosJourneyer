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
import { Mouse } from "../inputs/mouse";
import { Keyboard } from "../inputs/keyboard";
import { Gamepad } from "../inputs/gamepad";
import { DefaultControls } from "../defaultController/defaultControls";
import { CharacterControls } from "../spacelegs/characterControls";
import { Assets } from "../assets";
import { getRotationQuaternion, setRotationQuaternion } from "../uberCore/transforms/basicTransform";
import { Observable } from "@babylonjs/core/Misc/observable";
import { NeutronStar } from "../stellarObjects/neutronStar/neutronStar";

export class StarSystemView {
    private readonly helmetOverlay: HelmetOverlay;
    readonly bodyEditor: BodyEditor;
    readonly scene: UberScene;

    readonly havokPlugin: HavokPlugin;

    private defaultControls: DefaultControls | null = null;
    private spaceshipControls: ShipControls | null = null;
    private characterControls: CharacterControls | null = null;

    private readonly orbitRenderer: OrbitRenderer = new OrbitRenderer();
    private readonly axisRenderer: AxisRenderer = new AxisRenderer();

    readonly ui: SystemUI;

    private static readonly UN_ZOOM_ANIMATION = new Animation("unZoom", "radius", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    private starSystem: StarSystemController | null = null;

    private readonly chunkForge: ChunkForge = new ChunkForgeWorkers(Settings.VERTEX_RESOLUTION);

    readonly onInitStarSystem = new Observable<void>();

    constructor(engine: Engine, havokInstance: HavokPhysicsWithBindings) {
        this.helmetOverlay = new HelmetOverlay();
        this.bodyEditor = new BodyEditor(EditorVisibility.HIDDEN);

        const canvas = engine.getRenderingCanvas();
        if (canvas === null) throw new Error("Canvas is null");
        this.bodyEditor.setCanvas(canvas);

        StarSystemView.UN_ZOOM_ANIMATION.setKeys([
            {
                frame: 0,
                value: 30
            },
            {
                frame: 30,
                value: 600
            }
        ]);

        document.addEventListener("keydown", (e) => {
            if (e.key === "o") {
                this.ui.setEnabled(!this.ui.isEnabled());
            }
            if (e.key === "n") {
                this.orbitRenderer.setVisibility(!this.orbitRenderer.isVisible());
                this.axisRenderer.setVisibility(!this.axisRenderer.isVisible());
            }
            if (e.key === "u") this.bodyEditor.setVisibility(this.bodyEditor.getVisibility() === EditorVisibility.HIDDEN ? EditorVisibility.NAVBAR : EditorVisibility.HIDDEN);
            if (e.key === "b") this.helmetOverlay.setVisibility(!this.helmetOverlay.isVisible());

            if (e.key === "t") {
                this.ui.setTarget(this.getStarSystem().getClosestToScreenCenterOrbitalObject());
            }

            if (e.key === "g") {
                if (this.scene.getActiveController() === this.getSpaceshipControls()) {
                    this.switchToDefaultControls();
                } else if (this.scene.getActiveController() === this.getDefaultControls()) {
                    this.switchToCharacterControls();
                } else if (this.scene.getActiveController() === this.getCharacterControls()) {
                    this.switchToSpaceshipControls();
                }
            }
        });

        this.scene = new UberScene(engine, ScenePerformancePriority.Intermediate);
        this.scene.clearColor = new Color4(0, 0, 0, 0);
        this.scene.useRightHandedSystem = true;

        this.havokPlugin = new HavokPlugin(true, havokInstance);
        setMaxLinVel(this.havokPlugin, 10000, 10000);
        this.scene.enablePhysics(Vector3.Zero(), this.havokPlugin);

        const ambientLight = new HemisphericLight("ambientLight", Vector3.Zero(), this.scene);
        ambientLight.intensity = 0.3;

        this.scene.onBeforePhysicsObservable.add(() => {
            const deltaSeconds = engine.getDeltaTime() / 1000;
            this.update(deltaSeconds * Settings.TIME_MULTIPLIER);
        });

        window.addEventListener("resize", () => {
            this.bodyEditor.resize();
            this.scene.getEngine().resize(true);
        });

        this.bodyEditor.resize();
        this.helmetOverlay.setVisibility(false);

        this.ui = new SystemUI(this.scene);
    }

    initStarSystem() {
        this.scene.getEngine().loadingScreen.displayLoadingUI();
        this.scene.getEngine().loadingScreen.loadingUIText = `Warping to ${this.getStarSystem().model.getName()}`;

        this.getStarSystem().initPositions(10, this.chunkForge);
        this.ui.createObjectOverlays(this.getStarSystem().getOrbitalObjects());

        const firstBody = this.getStarSystem().getBodies()[0];
        if (firstBody === undefined) throw new Error("No bodies in star system");

        this.orbitRenderer.setOrbitalObjects(this.getStarSystem().getOrbitalObjects());
        this.axisRenderer.setObjects(this.getStarSystem().getOrbitalObjects());

        const activeController = this.scene.getActiveController();
        let controllerDistanceFactor = 5;
        if (firstBody instanceof BlackHole) controllerDistanceFactor = 7;
        else if (firstBody instanceof NeutronStar) controllerDistanceFactor = 100_000;
        positionNearObjectBrightSide(activeController, firstBody, this.getStarSystem(), controllerDistanceFactor);

        this.getStarSystem()
            .initPostProcesses()
            .then(() => {
                this.scene.getEngine().loadingScreen.hideLoadingUI();
                this.onInitStarSystem.notifyObservers();
            });
    }

    async initAssets() {
        await Assets.Init(this.scene);

        const canvas = this.scene.getEngine().getRenderingCanvas();
        if (canvas === null) throw new Error("Canvas is null");

        const mouse = new Mouse(canvas, 100);
        const keyboard = new Keyboard();
        const gamepad = new Gamepad();

        const maxZ = Settings.EARTH_RADIUS * 1e5;

        this.defaultControls = new DefaultControls(this.scene);
        this.defaultControls.speed = 0.2 * Settings.EARTH_RADIUS;
        this.defaultControls.getActiveCamera().maxZ = maxZ;
        this.defaultControls.addInput(keyboard);
        this.defaultControls.addInput(gamepad);

        this.spaceshipControls = new ShipControls(this.scene);
        this.spaceshipControls.getActiveCamera().maxZ = maxZ;
        this.spaceshipControls.addInput(keyboard);
        this.spaceshipControls.addInput(gamepad);
        this.spaceshipControls.addInput(mouse);

        this.characterControls = new CharacterControls(this.scene);
        this.characterControls.getTransform().setEnabled(false);
        this.characterControls.getActiveCamera().maxZ = maxZ;
        this.characterControls.addInput(keyboard);
        this.characterControls.addInput(gamepad);

        this.scene.setActiveController(this.spaceshipControls);
    }

    /**
     * Updates the system view. It updates the underlying star system, the UI, the chunk forge and the controls
     * @param deltaSeconds the time elapsed since the last update in seconds
     */
    update(deltaSeconds: number) {
        const starSystem = this.getStarSystem();

        Assets.BUTTERFLY_MATERIAL.update(starSystem.stellarObjects, this.scene.getActiveController().getTransform().getAbsolutePosition(), deltaSeconds);
        Assets.GRASS_MATERIAL.update(starSystem.stellarObjects, this.scene.getActiveController().getTransform().getAbsolutePosition(), deltaSeconds);

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

        this.helmetOverlay.update(nearestOrbitalObject);

        this.orbitRenderer.update();
    }

    getSpaceshipControls() {
        if (this.spaceshipControls === null) throw new Error("Spaceship controls is null");
        return this.spaceshipControls;
    }

    getCharacterControls() {
        if (this.characterControls === null) throw new Error("Character controls is null");
        return this.characterControls;
    }

    getDefaultControls() {
        if (this.defaultControls === null) throw new Error("Default controls is null");
        return this.defaultControls;
    }

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
    }

    switchToDefaultControls() {
        const shipControls = this.getSpaceshipControls();
        const characterControls = this.getCharacterControls();
        const defaultControls = this.getDefaultControls();

        characterControls.getTransform().setEnabled(false);
        shipControls.spaceship.warpTunnel.setThrottle(0);
        shipControls.spaceship.setEnabled(false, this.havokPlugin);

        this.scene.setActiveController(defaultControls);
        setRotationQuaternion(defaultControls.getTransform(), getRotationQuaternion(shipControls.getTransform()).clone());
        this.getStarSystem().postProcessManager.rebuild();
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

    /**
     * Sets the star system and generates it if needed and disposes the old one. Does not perform the init method
     * @param starSystem the star system to be set
     * @param needsGenerating whether the star system needs to be generated or not
     */
    setStarSystem(starSystem: StarSystemController, needsGenerating = true) {
        if (this.starSystem !== null) this.starSystem.dispose();
        this.starSystem = starSystem;

        if (needsGenerating) StarSystemHelper.Generate(this.starSystem);
    }

    hideUI() {
        this.bodyEditor.setVisibility(EditorVisibility.HIDDEN);
        this.helmetOverlay.setVisibility(false);
    }

    showUI() {
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
            this.hideUI();
            callback();
            this.scene.onAfterRenderObservable.addOnce(() => {
                (activeControls as ShipControls).thirdPersonCamera.radius = 30;
            });
        });
    }
}
