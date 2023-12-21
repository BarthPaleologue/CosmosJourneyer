import "../styles/index.scss";

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Assets } from "./assets";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { BaseTexture } from "@babylonjs/core/Materials/Textures/baseTexture";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new Engine(canvas, true);
const scene = new Scene(engine);

const camera = new FreeCamera("camera", new Vector3(0, 1, -1).scale(15), scene);
camera.setTarget(Vector3.Zero());
camera.attachControl(canvas, true);

new DirectionalLight("light", new Vector3(0, -1, 1), scene);
const hemi = new HemisphericLight("hemisphericLight", new Vector3(0, 1, 0), scene);
hemi.intensity = 0.5;

await Assets.Init(scene);

function showTexture(texture: BaseTexture, position: Vector3) {
    const plane = MeshBuilder.CreateGround("plane", { width: 0.9, height: 0.9 }, scene);
    const material = new StandardMaterial("material", scene);
    material.emissiveTexture = texture;
    material.disableLighting = true;
    material.specularColor.scaleInPlace(0);

    plane.position = position;
    plane.material = material;
}

const sideLength = 10;
let meshCounter = 0;
for (const rootMesh of scene.meshes) {
    rootMesh.isVisible = true;
    if (rootMesh.parent !== null) continue;
    meshCounter++;
    const extent = rootMesh.getHierarchyBoundingVectors();
    const maxDimension = Math.max(extent.max.x - extent.min.x, extent.max.y - extent.min.y, extent.max.z - extent.min.z);
    rootMesh.scaling.scaleInPlace(1 / maxDimension);
    rootMesh.position = new Vector3(sideLength + (meshCounter % sideLength) - sideLength / 2, 0, Math.floor(meshCounter / sideLength) - sideLength / 2);
}

const transformNodes = scene.transformNodes.slice();
for (const transform of transformNodes) {
    transform.instantiateHierarchy();
}

for (let i = 0; i < scene.textures.length; i++) {
    showTexture(scene.textures[i], new Vector3((i % sideLength) - sideLength / 2, 0, Math.floor(i / sideLength) - sideLength / 2));
}

engine.runRenderLoop(() => {
    scene.render();
});
