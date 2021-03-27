import { Planet } from "./components/planet.js";
let canvas = document.getElementById("renderer");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let engine = new BABYLON.Engine(canvas);
let scene = new BABYLON.Scene(engine);
let camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, -15));
camera.attachControl(canvas);
let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-10, 10, -10), scene);
let planet = new Planet("planet", 5, 40, new BABYLON.Vector3(0, 0, 0), scene);
let interval = 0;
let c = 0;
document.addEventListener("keydown", e => {
    if (e.key == "s") {
        if (interval != 0)
            clearInterval(interval);
        planet.normalize(planet.radius);
    }
    if (e.key == "v")
        planet.morphToWiggles(5, 0.1);
    if (e.key == "a") {
        if (interval != 0)
            clearInterval(interval);
        c = 0;
        interval = setInterval(() => {
            planet.normalize(planet.radius);
            planet.morphToWiggles(100 * Math.sin(c / 1000), 0.1);
            c++; // L O L
        }, 10);
    }
    if (e.key == "w")
        planet.toggleWireframe();
    if (e.key == "p")
        planet.togglePointsCloud();
    if (e.key == "c")
        planet.addCraters(1);
});
engine.runRenderLoop(() => {
    planet.mesh.rotation.y += .002;
    scene.render();
});
