import { Engine } from "@babylonjs/core/Engines/engine";
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
import { Assets } from "./assets";
import { TelluricPlanemoModel } from "./planemos/telluricPlanemo/telluricPlanemoModel";
import { TelluricPlanemo } from "./planemos/telluricPlanemo/telluricPlanemo";
import { UberScene } from "./uberCore/uberScene";
import { Settings } from "./settings";
import { StarModel } from "./stellarObjects/star/starModel";
import { Keyboard } from "./inputs/keyboard";
import { Star } from "./stellarObjects/star/star";
import { ChunkForge } from "./planemos/telluricPlanemo/terrain/chunks/chunkForge";
import { CharacterController } from "./spacelegs/characterController";

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

const characterController = new CharacterController(scene);
characterController.addInput(new Keyboard());
characterController.getActiveCamera().attachControl(canvas, true);

const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
light.position = new Vector3(5, 5, 5).scaleInPlace(10);

const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
hemiLight.intensity = 0.2;

const shadowGenerator = new ShadowGenerator(1024, light);
shadowGenerator.useBlurExponentialShadowMap = true;

const chunkForge = new ChunkForge(Settings.VERTEX_RESOLUTION);

const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
sphere.position.y = 4;
sphere.position.x = 4;
sphere.material = Assets.DebugMaterial("sphere", true);
shadowGenerator.addShadowCaster(sphere);

const capsule = MeshBuilder.CreateCapsule("capsule", { radius: 0.6, height: 2 }, scene);
capsule.position.y = 4;
capsule.position.x = -4;
capsule.position.z = 4;
capsule.material = Assets.DebugMaterial("capsule", true);
capsule.visibility = 0.5;
shadowGenerator.addShadowCaster(capsule);

const auroraModel = new StarModel(984);
const aurora = new Star("Aurora", scene, auroraModel);
aurora.getTransform().setAbsolutePosition(new Vector3(0, aurora.getRadius() * 10.0, aurora.getRadius() * 40.0));

const newtonModel = new TelluricPlanemoModel(152);
const newton = new TelluricPlanemo("newton", scene, newtonModel);
newton.getTransform().setAbsolutePosition(new Vector3(0, -newtonModel.radius - 10e3, 0));
newton.updateLOD(characterController.getActiveCamera().getAbsolutePosition(), chunkForge);

characterController.setClosestWalkableObject(newton);

const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.75 }, scene);
const capsuleAggregate = new PhysicsAggregate(capsule, PhysicsShapeType.CAPSULE, { mass: 1, restitution: 0.2 }, scene);
capsuleAggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 1 });

const aggregates = [sphereAggregate, capsuleAggregate, newton.aggregate];
for (const aggregate of aggregates) {
    aggregate.body.disablePreStep = false;
}

const fallingAggregates = [sphereAggregate, capsuleAggregate];

const gravityOrigin = newton.getTransform().getAbsolutePosition();
const gravity = -9.81;

let clockSeconds = 0;

function updateBeforeHavok() {
    const deltaTime = engine.getDeltaTime() / 1000;
    clockSeconds += deltaTime;

    chunkForge.update();

    for (const aggregate of fallingAggregates) {
        const mass = aggregate.body.getMassProperties().mass;
        if (mass === undefined) throw new Error(`Mass is undefined for ${aggregate.body}`);
        const gravityDirection = aggregate.body.getObjectCenterWorld().subtract(gravityOrigin).normalize();
        aggregate.body.applyForce(gravityDirection.scaleInPlace(gravity * mass), aggregate.body.getObjectCenterWorld());
    }

    characterController.update(deltaTime);

    // planet thingy
    newton.updateInternalClock(-deltaTime / 10);
    aurora.updateInternalClock(-deltaTime / 10);

    newton.updateLOD(characterController.getActiveCamera().getAbsolutePosition(), chunkForge);
    newton.material.update(characterController.getActiveCamera().getAbsolutePosition(), [aurora]);
}

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.onBeforePhysicsObservable.add(updateBeforeHavok);
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => {
    engine.resize();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
