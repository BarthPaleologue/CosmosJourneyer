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
import { AbstractBody } from "../bodies/abstractBody";
import { StarSystemHelper } from "./starSystemHelper";
import { positionNearObjectBrightSide } from "../utils/positionNearObject";
import { ShipControls } from "../spaceship/shipControls";
import { OrbitRenderer } from "../orbit/orbitRenderer";
import { BlackHole } from "../stellarObjects/blackHole/blackHole";
import { ChunkForge } from "../planemos/telluricPlanemo/terrain/chunks/chunkForge";
import "@babylonjs/core/Loading/loadingScreen";
import { setMaxLinVel } from "../utils/havok";
import { HavokPhysicsWithBindings } from "@babylonjs/havok";

export class StarSystemView {
    private readonly helmetOverlay: HelmetOverlay;
    readonly bodyEditor: BodyEditor;
    readonly scene: UberScene;

    readonly havokPlugin: HavokPlugin;

    private readonly orbitRenderer: OrbitRenderer = new OrbitRenderer();
    private readonly axisRenderer: AxisRenderer = new AxisRenderer();

    readonly ui: SystemUI;

    private static readonly unZoomAnimation = new Animation("unZoom", "radius", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    private starSystem: StarSystemController | null = null;

    private readonly chunkForge = new ChunkForge(Settings.VERTEX_RESOLUTION);

    constructor(engine: Engine, havokInstance: HavokPhysicsWithBindings) {
        this.helmetOverlay = new HelmetOverlay();
        this.bodyEditor = new BodyEditor(EditorVisibility.HIDDEN);

        const canvas = engine.getRenderingCanvas();
        if (canvas === null) throw new Error("Canvas is null");
        this.bodyEditor.setCanvas(canvas);

        StarSystemView.unZoomAnimation.setKeys([
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
            const starSystem = this.getStarSystem();

            const deltaTime = engine.getDeltaTime() / 1000;

            this.chunkForge.update();
            starSystem.update(deltaTime * Settings.TIME_MULTIPLIER, this.chunkForge);

            this.ui.update(this.scene.getActiveCamera());

            const nearestBody = starSystem.getNearestOrbitalObject();

            if (nearestBody instanceof AbstractBody) {
                this.bodyEditor.update(nearestBody, starSystem.postProcessManager, this.scene);
            }
            this.helmetOverlay.update(nearestBody);

            this.orbitRenderer.update();
        });

        window.addEventListener("resize", () => {
            this.bodyEditor.resize();
            this.scene.getEngine().resize(true);
        });

        this.bodyEditor.resize();
        this.helmetOverlay.setVisibility(false);

        this.ui = new SystemUI(this.scene);
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

        if (needsGenerating) StarSystemHelper.generate(this.starSystem);
    }

    init() {
        this.scene.getEngine().loadingScreen.displayLoadingUI();
        this.scene.getEngine().loadingScreen.loadingUIText = `Warping to ${this.getStarSystem().model.getName()}`;

        this.getStarSystem().initPositions(100, this.chunkForge);
        this.ui.createObjectOverlays(this.getStarSystem().getObjects());

        const firstBody = this.getStarSystem().getBodies()[0];
        if (firstBody === undefined) throw new Error("No bodies in star system");

        this.orbitRenderer.setOrbitalObjects(this.getStarSystem().getBodies());
        this.axisRenderer.setObjects(this.getStarSystem().getBodies());

        const activeController = this.scene.getActiveController();
        positionNearObjectBrightSide(activeController, firstBody, this.getStarSystem(), firstBody instanceof BlackHole ? 7 : 5);
        if (activeController instanceof ShipControls) activeController.enableWarpDrive();

        this.getStarSystem()
            .initPostProcesses()
            .then(() => {
                this.scene.getEngine().loadingScreen.hideLoadingUI();
            });
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
        this.scene.getActiveController().getActiveCamera().animations = [StarSystemView.unZoomAnimation];
        this.scene.beginAnimation(this.scene.getActiveController().getActiveCamera(), 0, 60, false, 2.0, () => {
            this.scene.getActiveController().getActiveCamera().animations = [];
            this.hideUI();
            callback();
        });
    }
}
