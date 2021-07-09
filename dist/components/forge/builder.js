import "../../../include/babylon/babylon4.js";
import { Direction } from "./direction.js";
import { NoiseLayer } from "../../components/forge/layers/noiseLayer.js";
import { NoiseEngine } from "../../engine/perlin.js";
import { CraterFilter } from "./layers/filters/craterFilter.js";
let noiseEngine = new NoiseEngine();
noiseEngine.seed(69);
let radius = 10; // the planet radius
let noiseStrength = 0.7 * radius / 100;
let noiseFrequency = 1 / radius;
let noiseLayers = [];
let barrenBumpyLayer = new NoiseLayer(noiseEngine, {
    noiseStrength: noiseStrength,
    octaves: 10,
    baseAmplitude: 1000,
    baseFrequency: noiseFrequency,
    decay: 1.7,
    minValue: 0,
    offset: [0, 0, 0],
    useCraterMask: false,
});
let continentsLayer = new NoiseLayer(noiseEngine, {
    noiseStrength: noiseStrength,
    octaves: 2,
    baseAmplitude: 50 * 1e3,
    baseFrequency: noiseFrequency / 10,
    decay: 2,
    minValue: 0,
    offset: [0, 0, 0],
    useCraterMask: false,
});
let moutainsLayer = new NoiseLayer(noiseEngine, {
    noiseStrength: noiseStrength,
    octaves: 7,
    baseAmplitude: 10,
    baseFrequency: noiseFrequency,
    decay: 2,
    minValue: 0,
    offset: [0, 0, 0],
    useCraterMask: false,
}, [0]);
//noiseLayers.push(continentsLayer, moutainsLayer, barrenBumpyLayer);
noiseLayers.push(continentsLayer, moutainsLayer);
let craterFilter = new CraterFilter([]);
let craterModifiers = {
    radiusModifier: 1,
    steepnessModifier: 1,
    maxDepthModifier: 1,
    scaleFactor: 1,
};
let noiseModifiers = {
    strengthModifier: 1,
    amplitudeModifier: 1,
    frequencyModifier: 1,
    offsetModifier: BABYLON.Vector3.Zero(),
    minValueModifier: 1,
};
let terrainFunction = (p, noiseLayers, craterFilter, planetRadius) => {
    let coords = p.normalizeToNew().scale(planetRadius);
    let elevation = 0;
    let craterMask = craterFilter.evaluate(coords.normalizeToNew(), craterModifiers);
    elevation += craterMask;
    for (let layer of noiseLayers) {
        let maskFactor = 1;
        for (let i = 0; i < layer.masks.length; i++) {
            maskFactor *= noiseLayers[i].evaluate(coords, noiseModifiers);
        }
        if (layer.settings.useCraterMask && craterMask != 0)
            maskFactor = 0;
        elevation += layer.evaluate(coords, noiseModifiers) * maskFactor;
    }
    let newPosition = p.add(coords.normalizeToNew().scale(elevation * noiseStrength));
    return newPosition;
};
onmessage = e => {
    if (e.data.taskType == "buildTask") {
        let chunkLength = e.data.chunkLength;
        let subs = e.data.subdivisions;
        let depth = e.data.depth;
        let direction = e.data.direction;
        let offset = e.data.position;
        craterFilter.setCraters(e.data.craters);
        noiseModifiers = e.data.noiseModifiers;
        craterModifiers = e.data.craterModifiers;
        let size = chunkLength / (Math.pow(2, depth));
        let planetRadius = chunkLength / 2;
        let vertices = [];
        let faces = [];
        let uvs = [];
        let vertexPerLine = subs + 1;
        let rotation = BABYLON.Matrix.Identity();
        switch (direction) {
            case Direction.Up:
                rotation = BABYLON.Matrix.RotationX(Math.PI / 2);
                break;
            case Direction.Down:
                rotation = BABYLON.Matrix.RotationX(-Math.PI / 2);
                break;
            case Direction.Forward:
                rotation = BABYLON.Matrix.Identity();
                break;
            case Direction.Backward:
                rotation = BABYLON.Matrix.RotationY(Math.PI);
                break;
            case Direction.Left:
                rotation = BABYLON.Matrix.RotationY(-Math.PI / 2);
                break;
            case Direction.Right:
                rotation = BABYLON.Matrix.RotationY(Math.PI / 2);
                break;
        }
        for (let x = 0; x < vertexPerLine; x++) {
            for (let y = 0; y < vertexPerLine; y++) {
                let vertex = new BABYLON.Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
                vertex = vertex.scale(size);
                vertex = vertex.add(BABYLON.Vector3.FromArray(offset));
                vertex = BABYLON.Vector3.TransformCoordinates(vertex, rotation);
                vertex = vertex.normalizeToNew().scale(planetRadius);
                vertex = terrainFunction(vertex, noiseLayers, craterFilter, planetRadius);
                vertices.push(vertex.x, vertex.y, vertex.z);
                uvs.push(x / vertexPerLine, y / vertexPerLine);
                if (x < vertexPerLine - 1 && y < vertexPerLine - 1) {
                    faces.push([
                        x * vertexPerLine + y,
                        x * vertexPerLine + y + 1,
                        (x + 1) * vertexPerLine + y + 1,
                        (x + 1) * vertexPerLine + y,
                    ]);
                }
            }
        }
        let positions = vertices;
        let indices = [];
        let normals = [];
        // indices from faces
        for (let face of faces) {
            for (let i = 0; i < face.length - 2; i++) {
                indices.push(face[0], face[i + 2], face[i + 1]);
            }
        }
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        let tPositions = new Float32Array(positions.length);
        tPositions.set(positions);
        let tIndices = new Int16Array(indices.length);
        tIndices.set(indices);
        let tNormals = new Float32Array(normals.length);
        tNormals.set(normals);
        //@ts-ignore
        postMessage({
            p: tPositions,
            i: tIndices,
            n: tNormals,
        }, [tPositions.buffer, tIndices.buffer, tNormals.buffer]);
    }
    else {
        console.log(`Tâche reçue : ${e.data.taskType}`);
    }
};
