import { Planet } from "./planet.js";
let canvas = document.getElementById("renderer");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let engine = new BABYLON.Engine(canvas);
let scene = new BABYLON.Scene(engine);
let camera = new BABYLON.ArcRotateCamera("camera", 0, 0, 3, BABYLON.Vector3.Zero(), scene);
camera.setPosition(new BABYLON.Vector3(0, 0, -15));
camera.attachControl(canvas);
let light = new BABYLON.PointLight("light", new BABYLON.Vector3(-10, 10, -10), scene);
let s = BABYLON.Mesh.CreateSphere("s", 1, 1, scene);
s.position = BABYLON.Vector3.Zero();
let planet = new Planet(5, 40, new BABYLON.Vector3(0, 0, 0), scene);
planet.generateCubeMesh();
/*let mat = new BABYLON.StandardMaterial("mat1", scene);
mat.wireframe = false;

let [planeVertices, planeFaces] = generateProceduralPlane(3, 5);
let plane = createPolyhedron(planeVertices, planeFaces, 1, scene);
plane.material = mat;*/
document.addEventListener("keydown", e => {
    if (e.key == "s")
        planet.morphToSphere();
    if (e.key == "v")
        planet.morphToWiggles();
    if (e.key == "w")
        planet.toggleWireframe();
});
engine.runRenderLoop(() => scene.render());
