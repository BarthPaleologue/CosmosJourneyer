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
import { Assets } from "./assets";
import { TelluricPlanemoModel } from "./planemos/telluricPlanemo/telluricPlanemoModel";
import { TelluricPlanemo } from "./planemos/telluricPlanemo/telluricPlanemo";
import { UberScene } from "./uberCore/uberScene";
import { Settings } from "./settings";
import { translate } from "./uberCore/transforms/basicTransform";
import { StarModel } from "./stellarObjects/star/starModel";
import { Keyboard } from "./inputs/keyboard";
import { Star } from "./stellarObjects/star/star";
import { ChunkForge } from "./planemos/telluricPlanemo/terrain/chunks/chunkForge";
import { PhysicsRaycastResult } from "@babylonjs/core/Physics/physicsRaycastResult";
import { PhysicsEngineV2 } from "@babylonjs/core/Physics/v2";
import { ActionManager } from "@babylonjs/core/Actions/actionManager";
import { ExecuteCodeAction } from "@babylonjs/core/Actions/directActions";
import '@babylonjs/core/Collisions/collisionCoordinator';

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

const chunkForge = new ChunkForge(Settings.VERTEX_RESOLUTION);

const keyboard = new Keyboard();

const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
sphere.position.y = 4;
sphere.position.x = 4;
sphere.material = Assets.DebugMaterial("sphere", true);
shadowGenerator.addShadowCaster(sphere);

const character = Assets.CreateCharacterInstance();

const walkAnim = scene.getAnimationGroupByName("Walking");
if (walkAnim === null) throw new Error("'Walking' animation not found");
const walkBackAnim = scene.getAnimationGroupByName("WalkingBackwards");
if (walkBackAnim === null) throw new Error("'WalkingBackwards' animation not found");
const idleAnim = scene.getAnimationGroupByName("Idle");
if (idleAnim === null) throw new Error("'Idle' animation not found");
const sambaAnim = scene.getAnimationGroupByName("SambaDancing");
if (sambaAnim === null) throw new Error("'Samba' animation not found");

camera.setTarget(character);

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
newton.updateLOD(camera.globalPosition, chunkForge);

const sphereAggregate = new PhysicsAggregate(sphere, PhysicsShapeType.SPHERE, { mass: 1, restitution: 0.75 }, scene);
const capsuleAggregate = new PhysicsAggregate(capsule, PhysicsShapeType.CAPSULE, { mass: 1, restitution: 0.2 }, scene);
capsuleAggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 1 });

const aggregates = [sphereAggregate, capsuleAggregate, newton.aggregate];
for (const aggregate of aggregates) {
  aggregate.body.disablePreStep = false;
}
const meshes = [sphere, character, capsule, newton.getTransform()];

const fallingAggregates = [sphereAggregate, capsuleAggregate];

const gravityOrigin = newton.getTransform().getAbsolutePosition();
const gravity = -9.81;

const inputMap: Map<string, boolean> = new Map<string, boolean>();
scene.actionManager = new ActionManager(scene);
scene.actionManager.registerAction(
  new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (e) => {
    inputMap.set(e.sourceEvent.key, e.sourceEvent.type == "keydown");
  })
);
scene.actionManager.registerAction(
  new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (e) => {
    inputMap.set(e.sourceEvent.key, e.sourceEvent.type == "keydown");
  })
);


const raycastResult = new PhysicsRaycastResult();

let clockSeconds = 0;


let animating = false;

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

  /*if (camera.globalPosition.length() > 100) {
    const displacement = camera.globalPosition.negate();
    for (const mesh of meshes) {
      translate(mesh, displacement);
    }
  }*/

  const characterSpeed = 0.03;
  const characterSpeedBackwards = 0.02;
  const characterRotationSpeed = 0.1;

  let keydown = false;
  if (inputMap.get("z") || inputMap.get("w")) {
    character.moveWithCollisions(character.forward.scaleInPlace(-characterSpeed));
    keydown = true;
  }
  if (inputMap.get("s")) {
    character.moveWithCollisions(character.forward.scaleInPlace(characterSpeedBackwards));
    keydown = true;
  }
  if (inputMap.get("q") || inputMap.get("a")) {
    character.rotate(Vector3.Up(), characterRotationSpeed);
    keydown = true;
  }
  if (inputMap.get("d")) {
    character.rotate(Vector3.Up(), -characterRotationSpeed);
    keydown = true;
  }
  if (inputMap.get("b")) {
    keydown = true;
  }

  //Manage animations to be played
  if (keydown) {
    if (!animating) {
      animating = true;
      if (inputMap.get("s")) {
        //Walk backwards
        if(walkBackAnim === null) throw new Error("'WalkingBackwards' animation not found");
        walkBackAnim.start(true, 1, walkBackAnim.from, walkBackAnim.to, false);
      } else if (inputMap.get("b")) {
        //Samba!
        if(sambaAnim === null) throw new Error("'Samba' animation not found");
        sambaAnim.start(true, 1, sambaAnim.from, sambaAnim.to, false);
      } else {
        //Walk
        if(walkAnim === null) throw new Error("'Walking' animation not found");
        walkAnim.start(true, 1, walkAnim.from, walkAnim.to, true);
      }
    }
  } else {
    if (animating) {
      //Default animation is idle when no key is down
      if(idleAnim === null) throw new Error("'Idle' animation not found");
      idleAnim.start(true, 1, idleAnim.from, idleAnim.to, false);

      //Stop all animations besides Idle Anim when no key is down
      if(walkAnim === null) throw new Error("'Walking' animation not found");
      if(sambaAnim === null) throw new Error("'Samba' animation not found");
      if(walkBackAnim === null) throw new Error("'WalkingBackwards' animation not found");
      sambaAnim.stop();
      walkAnim.stop();
      walkBackAnim.stop();

      //Ensure animation are played only once per rendering loop
      animating = false;
    }
  }


// downward raycast
  const start = character.position.add(character.up.scale(50e3));
  const end = character.position.add(character.up.scale(-50e3));
  (scene.getPhysicsEngine() as PhysicsEngineV2).raycastToRef(start, end, raycastResult);
  if (raycastResult.hasHit) {
    character.position.y = raycastResult.hitPointWorld.y + 0.01;
  }

  // planet thingy
  newton.updateInternalClock(-deltaTime / 10);
  aurora.updateInternalClock(-deltaTime / 10);

  newton.updateLOD(camera.globalPosition, chunkForge);
  newton.material.update(camera.globalPosition, [aurora]);
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
