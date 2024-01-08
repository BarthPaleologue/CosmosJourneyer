import "../styles/index.scss";

import { Engine } from "@babylonjs/core/Engines/engine";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setMaxLinVel } from "./utils/havok";
import { UberScene } from "./uberCore/uberScene";
import { ScenePerformancePriority } from "@babylonjs/core";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Assets } from "./assets";
import { ShipControls } from "./spaceship/shipControls";
import { translate } from "./uberCore/transforms/basicTransform";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/core/Physics/physicsEngineComponent";
import { Keyboard } from "./inputs/keyboard";
import { Mouse } from "./inputs/mouse";
import { LandingPad } from "./landingPad/landingPad";
import { PhysicsViewer } from "@babylonjs/core/Debug/physicsViewer";
import { DefaultControls } from "./defaultController/defaultControls";
import { Spaceship } from "./spaceship/spaceship";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;

// Init Havok physics engine
const havokInstance = await HavokPhysics();
const havokPlugin = new HavokPlugin(true, havokInstance);
setMaxLinVel(havokPlugin, 10000, 10000);
console.log(`Havok initialized`);

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;
scene.enablePhysics(Vector3.Zero(), havokPlugin);
scene.clearColor = new Color4(0.2, 0.2, 0.6, 1);

const light = new DirectionalLight("light", new Vector3(0, -1, 1).normalize(), scene);

await Assets.Init(scene);

const physicsViewer = new PhysicsViewer();

const spaceship = new Spaceship(scene);

physicsViewer.showBody(spaceship.aggregate.body);

const landingPad = new LandingPad(scene);
landingPad.getTransform().position = new Vector3(0, -20, 50);

physicsViewer.showBody(landingPad.aggregate.body);

const defaultControls = new DefaultControls(scene);
defaultControls.speed *= 15;
defaultControls.addInput(new Keyboard());
scene.setActiveController(defaultControls);

translate(defaultControls.getTransform(), new Vector3(50, 0, 0));

defaultControls.getTransform().lookAt(Vector3.Lerp(spaceship.getTransform().position, landingPad.getTransform().position, 0.5));


scene.onBeforeRenderObservable.add(() => {
    const deltaTime = scene.deltaTime / 1000;
    scene.getActiveController().update(deltaTime);
    spaceship.update(deltaTime);
});

scene.executeWhenReady(() => {
    engine.runRenderLoop(() => {
        scene.render();
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "o") {
        spaceship.engageLanding(landingPad);
    }
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize(true);
});
