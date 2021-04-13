import "../babylon/babylon4.js";
import { Direction } from "./direction.js";
import { CraterLayer } from "./layers/craterLayer.js";
import { NoiseLayer } from "./layers/noiseLayer.js";
import { NoiseEngine } from "../engine/perlin.js";

onerror = e => console.log(e);

let noiseEngine = new NoiseEngine();
noiseEngine.seed(69);

let radius = 10; // the planet radius

let noiseStrength = 0.1;
let noiseFrequency = 0.1;

let noiseLayers: NoiseLayer[] = [];

let barrenBumpyLayer = new NoiseLayer(noiseEngine, {
    noiseStrength: noiseStrength,
    octaves: 10,
    baseAmplitude: 5,
    baseFrequency: noiseFrequency,
    decay: 1.7,
    minValue: 0,
    offset: BABYLON.Vector3.Zero()
});

let continentsLayer = new NoiseLayer(noiseEngine, {
    noiseStrength: noiseStrength,
    octaves: 10,
    baseAmplitude: 1,
    baseFrequency: noiseFrequency,
    decay: 2,
    minValue: 0.1,
    offset: BABYLON.Vector3.Zero()
});

let moutainsLayer = new NoiseLayer(noiseEngine, {
    noiseStrength: noiseStrength,
    octaves: 7,
    baseAmplitude: 5,
    baseFrequency: noiseFrequency,
    decay: 2,
    minValue: 0,
    offset: BABYLON.Vector3.Zero()
}, [0]);

noiseLayers.push(continentsLayer, moutainsLayer, barrenBumpyLayer);

let craterLayer = new CraterLayer([]);
let craterLayers = [craterLayer];

let craterModifiers = {
    radiusModifier: 1,
    steepnessModifier: 0.05,
    maxDepthModifier: 1,
    scaleFactor: 10,
};

let terrainFunction = (p: BABYLON.Vector3, noiseLayers: NoiseLayer[], craterLayers: CraterLayer[]) => {
    let coords = p.normalizeToNew().scale(radius);


    let elevation = 0;
    for (let layer of noiseLayers) {
        let maskFactor = 1;
        for (let i = 0; i < layer.masks.length; i++) {
            maskFactor *= noiseLayers[i].evaluate(coords, {
                strengthModifier: 1,
                amplitudeModifier: 1,
                frequencyModifier: 1,
                offsetModifier: BABYLON.Vector3.Zero(),
                minValueModifier: 1,
            });
        }
        elevation += layer.evaluate(coords, {
            strengthModifier: 1,
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: BABYLON.Vector3.Zero(),
            minValueModifier: 1,
        }) * maskFactor;
    }
    for (let craterLayer of craterLayers) {
        elevation += craterLayer.evaluate(coords.normalizeToNew(), craterModifiers);
    }

    let newPosition = p.add(coords.normalizeToNew().scale(elevation * noiseStrength));
    return newPosition;
};

onmessage = e => {
    let [
        radius,
        subs,
        depth,
        direction,
        offset,

        craters,
    ] = e.data;

    craterLayers[0].regenerate(craters);

    let size = radius / (2 ** depth);

    let vertices: number[] = [];
    let faces: number[][] = [];
    let uvs: number[] = [];
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
            vertex = vertex.normalizeToNew().scale(radius);

            vertex = terrainFunction(vertex, noiseLayers, craterLayers);

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
    let indices: number[] = [];
    let normals: number[] = [];

    // indices from faces
    for (let face of faces) {
        for (let i = 0; i < face.length - 2; i++) {
            indices.push(face[0], face[i + 2], face[i + 1]);
        }
    }

    BABYLON.VertexData.ComputeNormals(positions, indices, normals);

    let vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    //@ts-ignore
    postMessage(vertexData);
};