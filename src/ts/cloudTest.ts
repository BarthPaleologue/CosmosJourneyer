import { CloudPostProcess } from "./postProcesses/cloudPostProcess";

let canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let engine = new BABYLON.Engine(canvas);
engine.loadingScreen.displayLoadingUI();

let scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

let orbitalCamera = new BABYLON.ArcRotateCamera("orbitalCamera", Math.PI / 2, Math.PI / 3, 200, BABYLON.Vector3.Zero(), scene);

let freeCamera = new BABYLON.FreeCamera("freeCamera", new BABYLON.Vector3(0, 0, -200), scene);
freeCamera.keysUp.push(90, 87); // z,w
freeCamera.keysLeft.push(81, 65); // q,a
freeCamera.keysDown.push(83); // s
freeCamera.keysRight.push(68); // d
freeCamera.keysUpward.push(32); // space
freeCamera.keysDownward.push(16); // shift

let light = new BABYLON.PointLight("light", BABYLON.Vector3.Zero(), scene);

let sun = BABYLON.Mesh.CreateSphere("Sun", 32, 10, scene);
let vls1 = new BABYLON.VolumetricLightScatteringPostProcess("trueLight", 1, freeCamera, sun, 100);
let vls2 = new BABYLON.VolumetricLightScatteringPostProcess("trueLight2", 1, orbitalCamera, sun, 100);

let sunMaterial = new BABYLON.StandardMaterial("sunMaterial", scene);
sunMaterial.emissiveTexture = new BABYLON.Texture("./textures/sun.jpg", scene);
sun.material = sunMaterial;

light.parent = sun;

const planetRadius = 50;
const atmosphereRadius = 55;

let earth = BABYLON.Mesh.CreateSphere("Earth", 32, planetRadius * 2, scene);

let earthMaterial = new BABYLON.StandardMaterial("earthMaterial", scene);
earthMaterial.diffuseTexture = new BABYLON.Texture("./textures/earth.jpg", scene);
earthMaterial.emissiveTexture = new BABYLON.Texture("./textures/night2.jpg", scene);
earthMaterial.specularTexture = new BABYLON.Texture("./textures/specular2.jpg", scene);

earth.material = earthMaterial;

// The important line
let atmosphere = new CloudPostProcess("atmosphere", earth, planetRadius, atmosphereRadius, sun, freeCamera, scene);

function switchCamera(newCamera: BABYLON.Camera) {
    scene.activeCamera?.detachControl(canvas);
    scene.activeCamera = newCamera;
    newCamera.attachControl(canvas);

    //Call this function to use one atmosphere for all cameras
    atmosphere.setCamera(newCamera);
}
switchCamera(orbitalCamera);

earth.rotation.x = Math.PI; // textures are always upside down on sphere for some reason...

orbitalCamera.setTarget(earth);


//#region Sliders
new Slider("intensity", document.getElementById("intensity")!, 0, 40, atmosphere.settings.intensity, (val: number) => {
    atmosphere.settings.intensity = val;
});
//#endregion

document.getElementById("switchView")?.addEventListener("click", () => {
    if (scene.activeCamera == freeCamera) switchCamera(orbitalCamera);
    else switchCamera(freeCamera);
});

document.addEventListener("keydown", e => {
    if (e.key == "p") { // take screenshots
        BABYLON.Tools.CreateScreenshotUsingRenderTarget(engine, scene.activeCamera!, { precision: 4 });
    } else if (e.key == "f") {
        console.log(Math.round(engine.getFps()));
    } else if (e.key == "c") {
        if (scene.activeCamera == freeCamera) switchCamera(orbitalCamera);
        else switchCamera(freeCamera);
    }
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize();
});
window.addEventListener("wheel", () => {
    console.log(orbitalCamera.radius - planetRadius);
});

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();

    engine.runRenderLoop(() => {

        sun.position = new BABYLON.Vector3(100 * Math.cos(0), 50, 100 * Math.sin(0));

        scene.render();
    });
});

