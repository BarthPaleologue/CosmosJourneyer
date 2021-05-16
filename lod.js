import { AtmosphericScatteringPostProcess } from "./atmosphericScattering.js";
import { Planet } from "./components/planet.js";
let canvas = document.getElementById("renderer");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();
let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
//scene.enablePhysics(new BABYLON.Vector3(0, 0, 0), new BABYLON.CannonJSPlugin());
let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
freeCamera.minZ = 1;
freeCamera.attachControl(canvas);
freeCamera.checkCollisions = true;
//freeCamera.inertia = 0;
//freeCamera.angularSensibility = 500;
let box = BABYLON.Mesh.CreateBox("boate", 1, scene);
freeCamera.parent = box;
box.physicsImpostor = new BABYLON.PhysicsImpostor(box, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 });
box.showBoundingBox = true;
box.physicsImpostor.onCollide = e => {
    console.log("collision camera", e);
};
scene.activeCamera = freeCamera;
let light = new BABYLON.PointLight("light", BABYLON.Vector3.Zero(), scene);
const radius = 200 * 1e3; // diamètre en km
freeCamera.maxZ = Math.max(radius * 10, 10000);
let sun = BABYLON.Mesh.CreateSphere("tester", 32, 0.2 * radius, scene);
sun.position.z = radius;
sun.position.x = radius * 5;
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.emissiveTexture = new BABYLON.Texture("./textures/sun.jpg", scene);
sun.material = mat;
light.parent = sun;
let planet = new Planet("Arès", radius, new BABYLON.Vector3(0, 0, 4 * radius), 64, 2, 6, scene);
planet.colorSettings.sandColor = planet.colorSettings.steepColor;
planet.noiseModifiers.amplitudeModifier = 50;
planet.noiseModifiers.frequencyModifier = 0.0005;
planet.updateSettings();
planet.updateColors();
planet.attachNode.checkCollisions = true;
let vls = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, scene.activeCamera, sun, 100);
let atmosphere = new AtmosphericScatteringPostProcess("atmosphere", planet.attachNode, radius - 20e3, radius + 25e3, sun, freeCamera, scene);
atmosphere.settings.intensity = 10;
atmosphere.settings.falloffFactor = 17;
//let depth = new DepthPostProcess("depth", freeCamera, scene);
let keyboard = {};
document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera, { precision: 4 });
    }
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
        let upward = freeCamera.getDirection(BABYLON.Axis.Y);
        let right = freeCamera.getDirection(BABYLON.Axis.X);
        planet.chunkForge.update();
        planet.update(freeCamera.position, forward, sun.position, freeCamera);
        //planet.attachNode.rotation.y += 0.0001;
        if (keyboard["a"]) { // rotation autour de l'axe de déplacement
            box.rotate(forward, 0.02, BABYLON.Space.WORLD);
        }
        else if (keyboard["e"]) {
            box.rotate(forward, -0.02, BABYLON.Space.WORLD);
        }
        if (keyboard["i"]) {
            box.rotate(right, -0.02, BABYLON.Space.WORLD);
        }
        else if (keyboard["k"]) {
            box.rotate(right, 0.02, BABYLON.Space.WORLD);
        }
        if (keyboard["j"]) {
            box.rotate(upward, -0.02, BABYLON.Space.WORLD);
        }
        else if (keyboard["l"]) {
            box.rotate(upward, 0.02, BABYLON.Space.WORLD);
        }
        if (keyboard["c"]) {
            box.setDirection(BABYLON.Axis.Y, -Math.PI / 2);
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
            speed = 0.03;
        planet.attachNode.moveWithCollisions(deplacement);
        //planet.attachNode.physicsImpostor?.applyImpulse(deplacement, planet.attachNode.position);
    };
    let speed = 0.0002 * radius;
    engine.runRenderLoop(() => {
        scene.render();
    });
});
