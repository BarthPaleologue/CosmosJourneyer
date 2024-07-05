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

import "../styles/index.scss";

import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Misc/screenshotTools";
import { Tools } from "@babylonjs/core/Misc/tools";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import {
    Axis,
    DirectionalLight,
    HavokPlugin,
    HemisphericLight,
    MeshBuilder,
    PhysicsAggregate,
    PhysicsShapeType,
    PhysicsViewer,
    Scene,
    VertexBuffer
} from "@babylonjs/core";
import { Assets } from "./assets/assets";
import { DefaultControls } from "./defaultControls/defaultControls";
import { AsteroidField } from "./asteroidFields/asteroidField";
import HavokPhysics from "@babylonjs/havok";
import { Mesh } from "@babylonjs/core/Meshes";
import { createRingVertexData } from "./utils/ringBuilder";
import { Color3 } from "@babylonjs/core/Maths/math.color";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
engine.useReverseDepthBuffer = true;
engine.displayLoadingUI();

const havokInstance = await HavokPhysics();

const scene = new Scene(engine);
scene.useRightHandedSystem = true;

const havokPlugin = new HavokPlugin(true, havokInstance);
scene.enablePhysics(new Vector3(0, 0, 0), havokPlugin);

const defaultControls = new DefaultControls(scene);


const camera = defaultControls.getActiveCameras()[0];
camera.attachControl();

scene.enableDepthRenderer(camera, false, true);

await Assets.Init(scene);

const directionalLight = new DirectionalLight("sun", new Vector3(1, -1, 0), scene);
directionalLight.intensity = 0.7;

const hemi = new HemisphericLight("hemi", Vector3.Up(), scene);
hemi.intensity = 0.4;

function showNormals(mesh: Mesh, size: number, color: Color3, sc: Scene) {
    const normals = mesh.getVerticesData(VertexBuffer.NormalKind);
    const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
    color = color || Color3.White();
    sc = sc || scene;
    size = size || 1;

    if(normals === null || positions === null) {
        return null;
    }

    const lines = [];
    for (let i = 0; i < normals.length; i += 3) {
        const v1 = Vector3.FromArray(positions, i);
        const v2 = v1.add(Vector3.FromArray(normals, i).scaleInPlace(size));
        lines.push([v1.add(mesh.position), v2.add(mesh.position)]);
    }
    const normalLines = MeshBuilder.CreateLineSystem("normalLines", { lines: lines }, sc);
    normalLines.color = color;
    return normalLines;
}

const scaler = 1000;

const ring = new Mesh("ring", scene);
const ringVertexData = createRingVertexData(5 * scaler, 1 * scaler, 3 * scaler, 20);
ringVertexData.applyToMesh(ring);

ring.convertToFlatShadedMesh();

showNormals(ring, 1 * scaler, Color3.Red(), scene);

defaultControls.speed *= scaler;
defaultControls.getTransform().position.scaleInPlace(scaler);
defaultControls.getActiveCameras()[0].maxZ *= scaler;

scene.onBeforeRenderObservable.add(() => {
    defaultControls.update(engine.getDeltaTime() / 1000);
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    engine.runRenderLoop(() => {
        scene.render();
    });
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize(true);
});

document.addEventListener("keypress", (e) => {
    if (e.key === "p") {
        // take screenshot
        Tools.CreateScreenshot(engine, camera, { precision: 1 });
    }
});
