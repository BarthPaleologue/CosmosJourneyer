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
import { UberScene } from "./uberCore/uberScene";
import { CharacterControls } from "./spacelegs/characterControls";
import { TransformNodeWrapper } from "./utils/wrappers";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas);

const scene = new UberScene(engine);
scene.useRightHandedSystem = true;

const light = new DirectionalLight("dir01", new Vector3(1, -2, -1), scene);
light.position = new Vector3(5, 5, 5).scaleInPlace(10);

const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
hemiLight.intensity = 0.2;

const shadowGenerator = new ShadowGenerator(1024, light);
shadowGenerator.useBlurExponentialShadowMap = true;

const ground = new TransformNodeWrapper(MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene), 10);
(ground.getTransform() as Mesh).receiveShadows = true;

await Assets.Init(scene);

const havokInstance = await HavokPhysics();
const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(Vector3.Zero(), havokPlugin);

const characterController = new CharacterControls(scene);
characterController.getTransform().setAbsolutePosition(new Vector3(0, 2, 0));

scene.setActiveController(characterController);

const centerOfPlanet = new TransformNodeWrapper(new TransformNode("centerOfPlanet", scene), 1000e3);
centerOfPlanet.getTransform().position.y = -1000e3;

shadowGenerator.addShadowCaster(characterController.character, true);

characterController.setClosestWalkableObject(centerOfPlanet);

const groundAggregate = new PhysicsAggregate(ground.getTransform(), PhysicsShapeType.BOX, { mass: 0, restitution: 0.75 }, scene);
groundAggregate.body.setMassProperties({ inertia: Vector3.Zero(), mass: 0 });

let clockSeconds = 0;
function updateBeforeHavok() {
    const deltaTime = engine.getDeltaTime() / 1000;
    clockSeconds += deltaTime;

    characterController.update(deltaTime);
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
