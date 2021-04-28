import { Planet } from "./components/planet.js";
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
let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
freeCamera.minZ = 0.001;
freeCamera.attachControl(canvas);
//freeCamera.inertia = 0;
//freeCamera.angularSensibility = 500;
scene.activeCamera = freeCamera;
let light = new BABYLON.PointLight("light", BABYLON.Vector3.Zero(), scene);
const radius = 1000 * 1e3; // diamètre en km
freeCamera.maxZ = 1e8;
let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.2 * radius, scene);
sun.position.z = radius;
sun.position.x = radius * 5;
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveTexture = new BABYLON.Texture("./textures/sun.jpg", scene);
sun.material = mat;
light.parent = sun;
let planet = new Planet("Arès", radius, new BABYLON.Vector3(0, 0, 4 * radius), 64, 2, 5, scene);
planet.colorSettings.sandColor = planet.colorSettings.steepColor;
planet.noiseModifiers.amplitudeModifier = 300;
planet.noiseModifiers.frequencyModifier = 0.00003;
planet.updateSettings();
planet.updateColors();
let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, scene.activeCamera, sun, 100);
//let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet.attachNode, radius, radius * 2, sun, freeCamera, scene);
//let depth = new DepthPostProcess("depth", freeCamera, scene);
let keyboard = {};
document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "r") {
        planet.noiseModifiers.strengthModifier = Math.random() * 3;
        planet.updateSettings();
        planet.reset();
    }
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
    scene.beforeRender = () => {
        let forward = freeCamera.getDirection(BABYLON.Axis.Z);
        planet.chunkForge.update();
        planet.update(freeCamera.position, forward, sun.position, camera);
        planet.attachNode.rotation.y += 0.0002;
    };
    let speed = 0.0002 * radius;
    engine.runRenderLoop(() => {
        t += engine.getDeltaTime() / 1000;
        let forward = freeCamera.getDirection(BABYLON.Axis.Z);
        let upward = freeCamera.getDirection(BABYLON.Axis.Y);
        let right = freeCamera.getDirection(BABYLON.Axis.X);
        if (keyboard["a"]) { // rotation autour de l'axe de déplacement
            let rotation = BABYLON.Matrix.RotationAxis(forward, 0.005);
            upward = BABYLON.Vector3.TransformCoordinates(upward, rotation);
            freeCamera.upVector = upward;
        }
        else if (keyboard["e"]) {
            let rotation = BABYLON.Matrix.RotationAxis(forward, -0.005);
            upward = BABYLON.Vector3.TransformCoordinates(upward, rotation);
            freeCamera.upVector = upward;
        }
        if (keyboard["j"]) { // rotation autour du up vector
            let rotation = BABYLON.Matrix.RotationAxis(upward, -0.005);
            forward = BABYLON.Vector3.TransformCoordinates(forward, rotation);
            freeCamera.setTarget(forward);
        }
        else if (keyboard["l"]) {
            let rotation = BABYLON.Matrix.RotationAxis(upward, 0.005);
            forward = BABYLON.Vector3.TransformCoordinates(forward, rotation);
            freeCamera.setTarget(forward);
        }
        if (keyboard["i"]) { // rotation autour du vecteur de droite
            let rotation = BABYLON.Matrix.RotationAxis(right, -0.005);
            forward = BABYLON.Vector3.TransformCoordinates(forward, rotation);
            freeCamera.setTarget(forward);
        }
        else if (keyboard["k"]) {
            let rotation = BABYLON.Matrix.RotationAxis(right, 0.005);
            forward = BABYLON.Vector3.TransformCoordinates(forward, rotation);
            freeCamera.setTarget(forward);
        }
        let deplacement = BABYLON.Vector3.Zero();
        if (keyboard["z"])
            deplacement.subtractInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["s"])
            deplacement.addInPlace(forward.scale(speed * engine.getDeltaTime()));
        if (keyboard["q"])
            deplacement.addInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard["d"])
            deplacement.subtractInPlace(right.scale(speed * engine.getDeltaTime()));
        if (keyboard[" "])
            deplacement.subtractInPlace(upward.scale(speed * engine.getDeltaTime()));
        if (keyboard["Shift"])
            deplacement.addInPlace(upward.scale(speed * engine.getDeltaTime()));
        if (keyboard["+"])
            speed += 1;
        if (keyboard["-"])
            speed -= 1;
        if (keyboard["8"])
            speed = 1;
        planet.attachNode.position.addInPlace(deplacement);
        sun.position.addInPlace(deplacement);
        scene.render();
    });
});
