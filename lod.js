import { Chunk } from "./components/chunk.js";
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
let exemple = [
    new Chunk([0], scene),
    new Chunk([1], scene),
    new Chunk([2], scene),
    [
        new Chunk([3, 0], scene),
        [
            new Chunk([3, 1, 0], scene),
            new Chunk([3, 1, 1], scene),
            new Chunk([3, 1, 2], scene),
            new Chunk([3, 1, 3], scene)
        ],
        new Chunk([3, 2], scene),
        new Chunk([3, 3], scene),
    ],
];
function getChunkFromPath(tree, path) {
    if (tree instanceof Chunk) {
        return tree;
    }
    else {
        let fst = path.shift();
        //console.log(tree[fst], path);
        return getChunkFromPath(tree[fst], path);
    }
}
const baseLength = 10;
const maxDepth = 4;
let activeMat = new BABYLON.StandardMaterial("mat", scene);
activeMat.wireframe = true;
activeMat.diffuseColor = BABYLON.Color3.Red();
let inactiveMat = new BABYLON.StandardMaterial("mat2", scene);
inactiveMat.wireframe = true;
inactiveMat.diffuseColor = BABYLON.Color3.White();
function generateChunks(tree) {
    if (tree instanceof Chunk) {
        console.log(`generating chunk ${tree.path}`);
        tree.mesh.material = inactiveMat;
    }
    else {
        for (let subTree of tree) {
            generateChunks(subTree);
        }
    }
}
generateChunks(exemple);
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
    //sphere.position = new BABYLON.Vector3(8 * Math.cos(t) + baseLength, 8 * Math.sin(t) + baseLength, -2);
    //console.log(getPathToNearestChunk(new BABYLON.Vector2(sphere.position.x, sphere.position.y), 1));
    engine.runRenderLoop(() => {
        t += engine.getDeltaTime() / 1000;
        sphere.position = new BABYLON.Vector3(7 * Math.cos(3 * t) * Math.cos(t) + baseLength, 7 * Math.cos(3 * t) * Math.sin(t) + baseLength, -2);
        let positionPath = [];
        for (let i = 0; i < maxDepth; i++) {
            /*
                3   2
                0   1
            */
            let offsetX = 0;
            let offsetY = 0;
            for (let index of positionPath) {
                if (index == 1) {
                    offsetX += baseLength / (Math.pow(2, i));
                }
                else if (index == 2) {
                    offsetX += baseLength / (Math.pow(2, i));
                    offsetY += baseLength / (Math.pow(2, i));
                }
                else if (index == 3) {
                    offsetY += baseLength / (Math.pow(2, i));
                }
            }
            let relativePosition = new BABYLON.Vector2(sphere.position.x - offsetX, sphere.position.y - offsetY);
            if (relativePosition.x < baseLength / (Math.pow(2, i)) && relativePosition.y < baseLength / (Math.pow(2, i))) {
                positionPath.push(0);
            }
            else if (relativePosition.x > baseLength / (Math.pow(2, i)) && relativePosition.y < baseLength / (Math.pow(2, i))) {
                positionPath.push(1);
            }
            else if (relativePosition.x > baseLength / (Math.pow(2, i)) && relativePosition.y > baseLength / (Math.pow(2, i))) {
                positionPath.push(2);
            }
            else if (relativePosition.x < baseLength / (Math.pow(2, i)) && relativePosition.y > baseLength / (Math.pow(2, i))) {
                positionPath.push(3);
            }
        }
        //console.log(`survole ${positionPath}`);
        //console.log(getChunckCoordinates(new BABYLON.Vector2(sphere.position.x, sphere.position.y), 0));
        positionPath = getPathToNearestChunk(new BABYLON.Vector2(sphere.position.x, sphere.position.y), 0);
        //console.log(sphere.position);
        let newChunk = getChunkFromPath(exemple, positionPath);
        if (currentChunck != newChunk) {
            if (currentChunck != undefined)
                currentChunck.mesh.material = inactiveMat;
            currentChunck = newChunk;
            currentChunck.mesh.material = activeMat;
        }
        scene.render();
    });
});
