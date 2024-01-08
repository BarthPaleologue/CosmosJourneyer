import "../styles/index.scss";

import { Engine } from "@babylonjs/core/Engines/engine";
import HavokPhysics from "@babylonjs/havok";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { setMaxLinVel } from "./utils/havok";
import { UberScene } from "./uberCore/uberScene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Assets } from "./assets";
import { roll, translate } from "./uberCore/transforms/basicTransform";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import "@babylonjs/core/Physics/physicsEngineComponent";
import { Keyboard } from "./inputs/keyboard";
import { LandingPad } from "./landingPad/landingPad";
import { PhysicsViewer } from "@babylonjs/core/Debug/physicsViewer";
import { DefaultControls } from "./defaultController/defaultControls";
import { Spaceship } from "./spaceship/spaceship";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

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

const light = new DirectionalLight("light", new Vector3(-2, -5, 1).normalize(), scene);
const shadowGenerator = new ShadowGenerator(2048, light);

await Assets.Init(scene);

const spaceship = new Spaceship(scene);
shadowGenerator.addShadowCaster(spaceship.instanceRoot, true);
spaceship.getTransform().position = new Vector3(0, 0, -10);
roll(spaceship.getTransform(), Math.random() * 6.28);

const landingPad = new LandingPad(scene);
landingPad.getTransform().position = new Vector3(0, -20, 0);
landingPad.instanceRoot.getChildMeshes().forEach((mesh) => {
    mesh.receiveShadows = true;
});

/*const ground = MeshBuilder.CreateGround("ground", { width: 50, height: 50 });
ground.position.y = -40;
ground.receiveShadows = true;*/

/*const physicsViewer = new PhysicsViewer();
physicsViewer.showBody(spaceship.aggregate.body);
physicsViewer.showBody(landingPad.aggregate.body);*/

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
