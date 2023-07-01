import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";

import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Engines/Extensions/engine.cubeTexture";

import "@babylonjs/core/Physics/physicsEngineComponent";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { PhysicsShapeType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsAggregate } from "@babylonjs/core/Physics/v2/physicsAggregate";

import "../styles/index.scss";
import { Assets } from "./controller/assets";
import { PhysicsShapeBox, PhysicsShapeConvexHull, PhysicsShapeMesh } from "@babylonjs/core/Physics/v2/physicsShape";
import { Mesh, TransformNode } from "@babylonjs/core/Meshes";
import { PhysicsViewer } from "@babylonjs/core/Debug/physicsViewer";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { Spaceship } from "./better_spaceship/spaceship";
import { Keyboard } from "./controller/inputs/keyboard";


const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas);

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

await Assets.Init(scene);

const havokInstance = await HavokPhysics();
const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(Vector3.Zero(), havokPlugin);

// This creates and positions a free camera (non-mesh)
const camera = new ArcRotateCamera("camera", -Math.PI / 2, 1.0, 15, Vector3.Zero(), scene);
camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);

const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
light.position = new Vector3(5, 5, 5).scaleInPlace(10);

const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
hemiLight.intensity = 0.2;

const shadowGenerator = new ShadowGenerator(1024, light);
shadowGenerator.useBlurExponentialShadowMap = true;

const keyboard = new Keyboard();

const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
sphere.position.y = 4;
sphere.material = Assets.DebugMaterial("sphere", true);
shadowGenerator.addShadowCaster(sphere);

const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
box.position.y = 4;
box.position.x = -4;
box.material = Assets.DebugMaterial("box", true);
shadowGenerator.addShadowCaster(box);

const spaceship = new Spaceship([keyboard]);
spaceship.instanceRoot.position.y = 8;
shadowGenerator.addShadowCaster(spaceship.instanceRoot);

camera.setTarget(spaceship.instanceRoot);

const capsule = MeshBuilder.CreateCapsule("capsule", { radius: 0.6, height: 2 }, scene);
capsule.position.y = 4;
capsule.position.x = -4;
capsule.position.z = 4;
capsule.material = Assets.DebugMaterial("capsule", true);
shadowGenerator.addShadowCaster(capsule);

// Our built-in 'ground' shape.
const ground = MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene);
ground.receiveShadows = true;
const groundMaterial = Assets.DebugMaterial("ground", true);
groundMaterial.diffuseColor.scaleInPlace(0.5);
groundMaterial.specularColor.scaleInPlace(0.5);
ground.material = groundMaterial;

const viewer = new PhysicsViewer();

const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.75 }, scene);
const groundAggregate = new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0 }, scene);
const boxAggregate = new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 1, restitution: 0.2 }, scene);
const capsuleAggregate = new PhysicsAggregate(capsule, PhysicsShapeType.CAPSULE, { mass: 1, restitution: 0.2 }, scene);
spaceship.initPhysics(scene);

// add impulse to box
boxAggregate.body.applyImpulse(new Vector3(0, 0, -1), box.getAbsolutePosition());

const otherPhysicAggregates = [sphereAggregate, groundAggregate, boxAggregate, capsuleAggregate];
//viewer.showBody(spaceshipAggregate.body);

const gravity = new Vector3(0, -9.81, 0);

let clock = 0;
function updateScene() {
    const deltaTime = engine.getDeltaTime() / 1000;
    clock += deltaTime;

    spaceship.listenToInputs();

    const gravityForShip = gravity.scale(spaceship.getMass());

    for (const aggregate of otherPhysicAggregates) {
        const mass = aggregate.body.getMassProperties().mass;
        if (mass === undefined) throw new Error(`Mass is undefined for ${aggregate.body}`);
        aggregate.body.applyForce(gravity.scale(mass), aggregate.body.getObjectCenterWorld());
        //aggregate.body.applyForce(gravityForShip.scale(-1), aggregate.body.getObjectCenterWorld());
    }
    spaceship.getAggregate().body.applyForce(gravityForShip, spaceship.getAggregate().body.getObjectCenterWorld());
    //groundAggregate.body.applyForce(gravityForShip.scale(-1), groundAggregate.body.getObjectCenterWorld());
}

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.registerBeforeRender(() => updateScene());
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => {
    engine.resize();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
