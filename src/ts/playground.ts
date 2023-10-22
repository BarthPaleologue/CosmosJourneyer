import { Engine } from "@babylonjs/core/Engines/engine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
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
import { PhysicsViewer } from "@babylonjs/core/Debug/physicsViewer";
import { Spaceship } from "./better_spaceship/spaceship";
import { Keyboard } from "./controller/inputs/keyboard";
import { TelluricPlanemoModel } from "./model/planemos/telluricPlanemoModel";
import { TelluricPlanemo } from "./view/bodies/planemos/telluricPlanemo";
import { UberScene } from "./controller/uberCore/uberScene";
import { Settings } from "./settings";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas);

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

await Assets.Init(scene);

const havokInstance = await HavokPhysics();
const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(Vector3.Zero(), havokPlugin);

// This creates and positions a free camera (non-mesh)
const camera = new ArcRotateCamera("camera", -Math.PI / 4, 1.0, 40, Vector3.Zero(), scene);
camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);
camera.minZ = 1;
camera.maxZ = Settings.EARTH_RADIUS * 5;

const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
light.position = new Vector3(5, 5, 5).scaleInPlace(10);
light.parent = camera;

const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
hemiLight.intensity = 0.2;

const shadowGenerator = new ShadowGenerator(1024, light);
shadowGenerator.useBlurExponentialShadowMap = true;

const keyboard = new Keyboard();

const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
sphere.position.y = 4;
sphere.position.x = 4;
sphere.material = Assets.DebugMaterial("sphere", true);
shadowGenerator.addShadowCaster(sphere);

const box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
box.position.y = 4;
box.position.x = -4;
box.material = Assets.DebugMaterial("box", true);
shadowGenerator.addShadowCaster(box);

const spaceship = new Spaceship(scene, [keyboard]);
spaceship.instanceRoot.position.y = 8;
shadowGenerator.addShadowCaster(spaceship.instanceRoot);

camera.setTarget(spaceship.instanceRoot);

const capsule = MeshBuilder.CreateCapsule("capsule", { radius: 0.6, height: 2 }, scene);
capsule.position.y = 4;
capsule.position.x = -4;
capsule.position.z = 4;
capsule.material = Assets.DebugMaterial("capsule", true);
capsule.visibility = 0.5;
shadowGenerator.addShadowCaster(capsule);

const newtonModel = new TelluricPlanemoModel(152);
const newton = new TelluricPlanemo("newton", scene, newtonModel);
newton.transform.setAbsolutePosition(new Vector3(0, -newtonModel.radius - 11.18e3, 0));
newton.updateLOD(camera.globalPosition);

const viewer = new PhysicsViewer();

const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.75 }, scene);
const boxAggregate = new PhysicsAggregate(box, PhysicsShapeType.BOX, { mass: 1, restitution: 0.2 }, scene);
const capsuleAggregate = new PhysicsAggregate(capsule, PhysicsShapeType.CAPSULE, { mass: 1, restitution: 0.2 }, scene);
capsuleAggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 1 });
spaceship.initPhysics(scene);

// add impulse to box
boxAggregate.body.applyImpulse(new Vector3(0, 0, -1), box.getAbsolutePosition());

const aggregates = [sphereAggregate, boxAggregate, capsuleAggregate, spaceship.getAggregate(), newton.aggregate];
for (const aggregate of aggregates) {
    aggregate.body.disablePreStep = false;
}
const meshes = [sphere, box, capsule, spaceship.instanceRoot, newton.transform];

const fallingAggregates = [sphereAggregate, boxAggregate, capsuleAggregate, spaceship.getAggregate()];
viewer.showBody(spaceship.getAggregate().body);

const gravityOrigin = newton.transform.getAbsolutePosition();
const gravity = -9.81;

let clockSeconds = 0;

function updateBeforeHavok() {
    const deltaTime = engine.getDeltaTime() / 1000;
    clockSeconds += deltaTime;

    spaceship.update();

    for (const aggregate of fallingAggregates) {
        const mass = aggregate.body.getMassProperties().mass;
        if (mass === undefined) throw new Error(`Mass is undefined for ${aggregate.body}`);
        const gravityDirection = aggregate.body.getObjectCenterWorld().subtract(gravityOrigin).normalize();
        aggregate.body.applyForce(gravityDirection.scaleInPlace(gravity * mass), aggregate.body.getObjectCenterWorld());
    }

    // planet thingy
    newton.updateInternalClock(-deltaTime / 10);
    /*newton.updateRotation(deltaTime / 10);
    newton.nextState.position = newton.transform.getAbsolutePosition();
    newton.applyNextState();*/
    newton.updateLOD(camera.globalPosition);
    //newton.material.update(camera.globalPosition, [light]);
    Assets.ChunkForge.update();
}

function updateAfterHavok() {
    const spaceshipPosition = spaceship.getAbsolutePosition();

    for (const mesh of meshes) {
        mesh.position.subtractInPlace(spaceshipPosition);
    }
}

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.onAfterPhysicsObservable.add(updateAfterHavok);
    scene.onBeforePhysicsObservable.add(updateBeforeHavok);
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => {
    engine.resize();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
