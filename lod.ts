import { Planet } from "./components/planet.js";

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

let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
freeCamera.minZ = 0.001;
freeCamera.attachControl(canvas);

scene.activeCamera = freeCamera;

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-100, 100, -100), scene);

const radius = 10;
freeCamera.maxZ = Math.max(2000 * radius, 1000);

let planet = new Planet("Arès", radius, new BABYLON.Vector3(0, 0, 2 * radius), 32, 5, scene);

let sphere = BABYLON.Mesh.CreateSphere("tester", 32, 0.3, scene);
sphere.position.z = -30;
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveColor = BABYLON.Color3.Red();
sphere.material = mat;

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keypress", e => {
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

        let speed = 0.0002 * radius;

        if (keyboard["z"]) planet.attachNode.position.subtractInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["s"]) planet.attachNode.position.addInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["q"]) planet.attachNode.position.addInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard["d"]) planet.attachNode.position.subtractInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard[" "]) planet.attachNode.position.subtractInPlace(upward.scale(speed * engine.getDeltaTime()));
        if (keyboard["Shift"]) planet.attachNode.position.addInPlace(upward.scale(speed * engine.getDeltaTime()));

        planet.chunkForge.update();

        planet.updateLOD(freeCamera.position);
        //planet.attachNode.rotation.y += 0.001;

        scene.render();
    });
});

