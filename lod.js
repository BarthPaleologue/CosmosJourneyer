import { QuadTree } from "./components/quadtree.js";
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
let exempleTree = new QuadTree(3, 10, BABYLON.Vector3.Zero(), scene);
/*exempleTree.addBranch([]);
exempleTree.addBranch([1]);
exempleTree.addBranch([1, 3]);
exempleTree.deleteBranch([1, 3]);
exempleTree.deleteBranch([1]);*/
//exempleTree.addBranch([0, 2, 2, 1, 1]);
let exemple = exempleTree.tree;
const baseLength = 10;
const maxDepth = 4;
let activeMat = new BABYLON.StandardMaterial("mat", scene);
activeMat.wireframe = true;
activeMat.diffuseColor = BABYLON.Color3.Red();
let inactiveMat = new BABYLON.StandardMaterial("inactiveMat", scene);
inactiveMat.wireframe = true;
inactiveMat.diffuseColor = BABYLON.Color3.White();
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
function getPathToNearestChunk(position, depth) {
    // récupère le chemin dans le quadtree pour atteindre le chunk le plus proche de la position
    if (position.x <= baseLength / (Math.pow(2, depth)) && position.y <= baseLength / (Math.pow(2, depth))) {
        // coin bas gauche
        if (depth == maxDepth)
            return [0];
        else
            return [0].concat(getPathToNearestChunk(position, depth + 1));
    }
    else if (position.x >= baseLength / (Math.pow(2, depth)) && position.y <= baseLength / (Math.pow(2, depth))) {
        // coin bas droit
        if (depth == maxDepth)
            return [1];
        else
            return [1].concat(getPathToNearestChunk(new BABYLON.Vector2(position.x - baseLength / (Math.pow(2, depth)), position.y), depth + 1));
    }
    else if (position.x >= baseLength / (Math.pow(2, depth)) && position.y >= baseLength / (Math.pow(2, depth))) {
        // coin haut droit
        if (depth == maxDepth)
            return [2];
        else
            return [2].concat(getPathToNearestChunk(new BABYLON.Vector2(position.x - (baseLength / (Math.pow(2, depth))), position.y - (baseLength / (Math.pow(2, depth)))), depth + 1));
    }
    else if (position.x <= baseLength / (Math.pow(2, depth)) && position.y >= baseLength / (Math.pow(2, depth))) {
        // coin haut gauche
        if (depth == maxDepth)
            return [3];
        else
            return [3].concat(getPathToNearestChunk(new BABYLON.Vector2(position.x, position.y - (baseLength / (Math.pow(2, depth)))), depth + 1));
    }
    else {
        console.error(position, baseLength, depth);
        return [];
    }
}
scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    let t = 0;
    let currentChunck;
    engine.runRenderLoop(() => {
        //console.log(scene.materials.length, Math.round(engine.getFps()));
        t += engine.getDeltaTime() / 1000;
        sphere.position = new BABYLON.Vector3(7 * Math.cos(3 * t) * Math.cos(t) + baseLength, 7 * Math.cos(3 * t) * Math.sin(t) + baseLength, -2);
        let positionPath = getPathToNearestChunk(new BABYLON.Vector2(sphere.position.x, sphere.position.y), 0);
        //positionPath.shift();
        exempleTree.addBranch(positionPath.slice(0, 2));
        //exempleTree.setPosition(new BABYLON.Vector3(0, -2, 0));
        //exempleTree.addBranch([0, 2]);
        //console.log(positionPath);
        let newChunk = exempleTree.getChunkFromPath(positionPath);
        if (currentChunck != newChunk) {
            if (currentChunck != undefined)
                currentChunck.mesh.material = inactiveMat;
            currentChunck = newChunk;
            currentChunck.mesh.material = activeMat;
        }
        scene.render();
    });
});
