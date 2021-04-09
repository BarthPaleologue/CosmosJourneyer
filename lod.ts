import { Planet } from "./components/planet.js";
import { ProceduralSphere } from "./components/proceduralSphere.js";
import { NoiseEngine } from "./engine/perlin.js";

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, -15));
//camera.attachControl(canvas);

let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
freeCamera.attachControl(canvas);

scene.activeCamera = freeCamera;

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-100, 100, -100), scene);

function morphToWiggles(p: BABYLON.Vector3) {
    let elevation = Math.sin(p.y) ** 2;
    return p.add(p.normalizeToNew().scale(elevation));
}



let planet = new Planet("Arès", 1000, new BABYLON.Vector3(0, 0, 1900), 16, 4, scene);

//let sphere = BABYLON.Mesh.CreateSphere("tester", 32, 0.3, scene);

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
});

document.addEventListener("keyup", e => {
    keyboard[e.key] = false;
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    let t = 0;

    engine.runRenderLoop(() => {
        t += engine.getDeltaTime() / 1000;

        /*if (keyboard["z"]) sphere.position.z += 0.01 * engine.getDeltaTime();
        if (keyboard["s"]) sphere.position.z -= 0.01 * engine.getDeltaTime();
        if (keyboard["q"]) sphere.position.x -= 0.01 * engine.getDeltaTime();
        if (keyboard["d"]) sphere.position.x += 0.01 * engine.getDeltaTime();
        if (keyboard[" "]) sphere.position.y += 0.01 * engine.getDeltaTime();
        if (keyboard["Shift"]) sphere.position.y -= 0.01 * engine.getDeltaTime();*/

        let forward = freeCamera.getDirection(BABYLON.Axis.Z);
        let upward = freeCamera.getDirection(BABYLON.Axis.Y);
        let right = freeCamera.getDirection(BABYLON.Axis.X);

        if (keyboard["z"]) planet.attachNode.position.subtractInPlace(forward.scale(0.2 * engine.getDeltaTime()));
        if (keyboard["s"]) planet.attachNode.position.addInPlace(forward.scale(0.2 * engine.getDeltaTime()));
        if (keyboard["q"]) planet.attachNode.position.addInPlace(right.scale(0.2 * engine.getDeltaTime()));
        if (keyboard["d"]) planet.attachNode.position.subtractInPlace(right.scale(0.2 * engine.getDeltaTime()));
        if (keyboard[" "]) planet.attachNode.position.subtractInPlace(upward.scale(0.2 * engine.getDeltaTime()));
        if (keyboard["Shift"]) planet.attachNode.position.addInPlace(upward.scale(0.2 * engine.getDeltaTime()));

        planet.updateLOD(freeCamera.position);

        scene.render();
    });
});

