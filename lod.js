import { Direction } from "./components/direction.js";
import { PlaneLOD } from "./components/planetSide.js";
let canvas = document.getElementById("renderer");
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
let planet = BABYLON.Mesh.CreateSphere("planet", 32, 1, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveColor = BABYLON.Color3.Red();
planet.material = mat;
const size = 10;
const baseSubdivisions = 20;
let terrain = new PlaneLOD("t1", 4, size, baseSubdivisions, Direction.Up, planet, scene);
let terrain2 = new PlaneLOD("t1", 4, size, baseSubdivisions, Direction.Forward, planet, scene);
let sphere = BABYLON.Mesh.CreateSphere("tester", 32, 0.3, scene);
let keyboard = {};
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
        if (keyboard["z"])
            sphere.position.z += 0.01 * engine.getDeltaTime();
        if (keyboard["s"])
            sphere.position.z -= 0.01 * engine.getDeltaTime();
        if (keyboard["q"])
            sphere.position.x -= 0.01 * engine.getDeltaTime();
        if (keyboard["d"])
            sphere.position.x += 0.01 * engine.getDeltaTime();
        if (keyboard[" "])
            sphere.position.y += 0.01 * engine.getDeltaTime();
        if (keyboard["Shift"])
            sphere.position.y -= 0.01 * engine.getDeltaTime();
        //terrain.offsetPosition(new BABYLON.Vector3(0, 0, -size / 2));
        terrain.updateLOD(sphere.position);
        terrain2.updateLOD(sphere.position);
        /*terrain2.updateLOD(sphere.position);
        terrain3.updateLOD(sphere.position);
        terrain4.updateLOD(sphere.position);
        terrain5.updateLOD(sphere.position);
        terrain6.updateLOD(sphere.position);*/
        scene.render();
    });
});
