import { Planet } from "./components/planet.js";
import { Slider } from "./SliderJS-main/slider.js";

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.collisionsEnabled = true;
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, -15));
camera.attachControl(canvas);

//@ts-ignore
/*let player = BABYLON.Mesh.CreateBox("player", 1, scene);
player.position = new BABYLON.Vector3(0, 0, -7);
player.checkCollisions = true;
player.ellipsoid = new BABYLON.Vector3(0, 0, 0);*/

/*let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, 0), scene);
freeCamera.parent = player;
freeCamera.attachControl(canvas);

let acc = BABYLON.Vector3.Zero();
let speed = BABYLON.Vector3.Zero();*/

scene.activeCamera = camera;

let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-100, 100, -100), scene);

let planet = new Planet("planet", 10, parseInt(prompt("nb subdivisions : ") || "60"), new BABYLON.Vector3(0, 0, 0), true, scene);

let watersphere = BABYLON.Mesh.CreateSphere("water", 32, 10.6, scene);
let mat = new BABYLON.StandardMaterial("mat", scene);
mat.diffuseColor = new BABYLON.Color3(0, 0, 0.7);
watersphere.material = mat;
watersphere.visibility = 0.5;

let interval = 0;
let c = 0;

new Slider("noiseOffsetX", document.getElementById("noiseOffsetX")!, 0, 50, 0, (val: number) => {
    planet.refreshNoise(undefined, undefined, val / 10);
});

new Slider("noiseOffsetY", document.getElementById("noiseOffsetY")!, 0, 50, 0, (val: number) => {
    planet.refreshNoise(undefined, undefined, undefined, val / 10);
});

new Slider("noiseStrength", document.getElementById("noiseStrength")!, 0, 20, 10, (val: number) => {
    planet.refreshNoise(val / 100);
});

new Slider("noiseFrequency", document.getElementById("noiseFrequency")!, 0, 50, 30, (val: number) => {
    planet.refreshNoise(undefined, val / 100);
});

new Slider("nbCraters", document.getElementById("nbCraters")!, 0, 500, 200, (nbCraters: number) => {
    planet.generateCraters(nbCraters);
});

new Slider("craterRadius", document.getElementById("craterRadius")!, 1, 20, 10, (radiusFactor: number) => {
    planet.refreshCraters(radiusFactor / 10);
});

new Slider("craterSteepness", document.getElementById("craterSteepness")!, 1, 20, 15, (steepnessFactor: number) => {
    planet.refreshCraters(undefined, steepnessFactor / 10);
});

new Slider("craterDepth", document.getElementById("craterDepth")!, 1, 20, 10, (depthFactor: number) => {
    planet.refreshCraters(undefined, undefined, depthFactor / 10);
});

document.getElementById("randomCraters")?.addEventListener("click", () => {
    planet.generateCraters();
});

let keyboard: { [key: string]: boolean; } = {};

document.addEventListener("keydown", e => {
    keyboard[e.key] = true;
    if (e.key == "r") {
        if (interval != 0) clearInterval(interval);
        planet.normalize(planet.radius);
    }
    if (e.key == "v") planet.morphToWiggles(5, 0.1);
    if (e.key == "a") {
        if (interval != 0) clearInterval(interval);
        c = 0;
        interval = setInterval(() => {
            planet.normalize(planet.radius);
            planet.morphToWiggles(100 * Math.sin(c / 1000), 0.1);
            c++; // L O L
        }, 10);
    }
    if (e.key == "w") planet.toggleWireframe();
    if (e.key == "p") planet.togglePointsCloud();
});

document.addEventListener("keyup", e => {
    keyboard[e.key] = false;
});

document.getElementById("random")?.addEventListener("click", () => {
    planet.regenerate(200);
});

//let dt = 1 / 60;

/*var currentPosition = { x: 0, y: 0 };
var currentRotation = { x: 0, y: 0 };
var clicked = false;
canvas.addEventListener("pointerdown", function (evt) {
    currentPosition.x = evt.clientX;
    currentPosition.y = evt.clientY;
    currentRotation.x = player.rotation.x;
    currentRotation.y = player.rotation.y;
    clicked = true;
});

canvas.addEventListener("pointermove", function (evt) {
    if (!clicked) {
        return;
    }
    player.rotation.y = currentRotation.y - (evt.clientX - currentPosition.x) / 300.0;
    player.rotation.x = currentRotation.x - (evt.clientY - currentPosition.y) / 300.0;
});

canvas.addEventListener("pointerup", function (evt) {
    clicked = false;
});*/

//canvas.requestPointerLock();

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    engine.runRenderLoop(() => {
        /*let dt = 1 / engine.getFps();
        let directionToPlanet = planet.position.subtract(player.position).normalize().scale(1);
    
        if (player.intersectsMesh(planet.mesh)) {
            acc = BABYLON.Vector3.Zero();
            speed = BABYLON.Vector3.Zero();
        } else {
            speed = speed.add(directionToPlanet.scale(dt));
        }
    
        let yaxis = directionToPlanet;
        let xaxis = BABYLON.Vector3.Cross(BABYLON.Axis.Y, yaxis);
        let zaxis = BABYLON.Vector3.Cross(xaxis, yaxis);
    
        player.rotation = BABYLON.Vector3.RotationFromAxis(xaxis, yaxis.scale(-1), zaxis);
        player.rotation.addInPlace(freeCamera.rotation);
    
        player.moveWithCollisions(speed.scale(dt));*/



        //player.rotation.y = camera.rotation.y;

        //console.log(freeCamera.getTarget().subtract(player.position));

        //let oTarget = freeCamera.getTarget().subtract(player.position);
        //let target = new BABYLON.Vector3(oTarget.x, oTarget.z, oTarget.y);

        /*if (keyboard["z"]) {
            player.moveWithCollisions(player.forward.scale(dt));
        }
        if (keyboard["q"]) {
            player.moveWithCollisions(player.right.scale(-dt));
        }
        if (keyboard["s"]) {
            player.moveWithCollisions(player.forward.scale(-dt));
        }
        if (keyboard["d"]) {
            player.moveWithCollisions(player.right.scale(dt));
        }
        if (keyboard["space"]) {
            player.moveWithCollisions(player.up.scale(dt));
        }
        if (keyboard["shift"]) {
            player.moveWithCollisions(player.up.scale(-dt));
        }*/

        planet.mesh.rotation.y += .002;
        scene.render();
    });
});

