import { PlaneLOD } from "./components/planeLOD.js";

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, -15));
camera.attachControl(canvas);

scene.activeCamera = camera;

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-100, 100, -100), scene);

let terrain = new PlaneLOD(4, 10, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), scene);
terrain.rotate(new BABYLON.Vector3(Math.PI / 2, Math.PI / 2, 0));

let terrain2 = new PlaneLOD(4, 10, new BABYLON.Vector3(0, 0, -10), BABYLON.Vector3.Zero(), scene);

let sphere = BABYLON.Mesh.CreateSphere("tester", 32, 0.3, scene);

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

        if (keyboard["z"]) sphere.position.z += 0.01 * engine.getDeltaTime();
        if (keyboard["s"]) sphere.position.z -= 0.01 * engine.getDeltaTime();
        if (keyboard["q"]) sphere.position.x -= 0.01 * engine.getDeltaTime();
        if (keyboard["d"]) sphere.position.x += 0.01 * engine.getDeltaTime();
        if (keyboard[" "]) sphere.position.y += 0.01 * engine.getDeltaTime();
        if (keyboard["Shift"]) sphere.position.y -= 0.01 * engine.getDeltaTime();

        terrain.updateLOD(sphere.position);
        terrain2.updateLOD(sphere.position);

        scene.render();
    });
});

