import "../../../../include/babylon/babylon4.js";
import { Direction } from "./direction.js";
import { NoiseLayer } from "./layers/noiseLayer.js";
import { CraterFilter } from "./layers/filters/craterFilter.js";
import { ComputeNormals } from "./computeNormals.js";
import { Vector3 } from "./lightWeightVector3.js";
let radius = 10; // the planet radius
let noiseFrequency = 1 / radius;
let noiseLayers = [];
let barrenBumpyLayer = new NoiseLayer({
    noiseStrength: 0.1,
    octaves: 10,
    baseAmplitude: 1000,
    baseFrequency: noiseFrequency,
    decay: 1.7,
    minValue: 0,
    offset: [0, 0, 0],
    useCraterMask: false,
});
let continentsLayer = new NoiseLayer({
    noiseStrength: 0.01,
    octaves: 2,
    baseAmplitude: 10 * 1e3,
    baseFrequency: noiseFrequency / 10,
    decay: 2,
    minValue: 0,
    offset: [0, 0, 0],
    useCraterMask: false,
});
let moutainsLayer = new NoiseLayer({
    noiseStrength: 0.01,
    octaves: 7,
    baseAmplitude: 3,
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
function terrainFunction(p, noiseLayers, craterFilter, planetRadius) {
    let initialPosition = [p.x, p.y, p.z];
    let initialMagnitude = Math.sqrt(Math.pow(initialPosition[0], 2) + Math.pow(initialPosition[1], 2) + Math.pow(initialPosition[2], 2));
    // on se ramène à la position à la surface du globe (sans relief)
    initialPosition = initialPosition.map((value) => value * planetRadius / initialMagnitude);
    let coords = BABYLON.Vector3.FromArray(initialPosition); // p.normalizeToNew().scale(planetRadius);
    let unitCoords = coords.normalizeToNew();
    let elevation = 0;
    let craterMask = craterFilter.evaluate(unitCoords, craterModifiers) / 20;
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
    let newPosition = p.add(unitCoords.scale(elevation));
    return new Vector3(newPosition.x, newPosition.y, newPosition.z);
}
;
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
        //let uvs: number[] = [];
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
                let vertexPosition = new Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
                vertexPosition = vertexPosition.scaleToNew(size);
                //vertexPosition = vertexPosition.map((value: number) => value * size);
                //vertexPosition = vertexPosition.scale(size);
                let vecOffset = Vector3.FromArray(offset);
                //vertexPosition[0] += offset[0];
                //vertexPosition[1] += offset[1];
                //vertexPosition[2] += offset[2];
                vertexPosition = vertexPosition.addToNew(vecOffset);
                //vertexPosition = vertexPosition.add(BABYLON.Vector3.FromArray(offset));
                let vertPosVec = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(vertexPosition._x, vertexPosition._y, vertexPosition._z), rotation);
                vertexPosition = new Vector3(vertPosVec.x, vertPosVec.y, vertPosVec.z);
                vertexPosition = vertexPosition.normalizeToNew().scaleToNew(planetRadius);
                //vertexPosition = vertexPosition.map((value: number) => value * planetRadius / magnitude);
                vertPosVec = new BABYLON.Vector3(vertexPosition._x, vertexPosition._y, vertexPosition._z); //vertPosVec.normalizeToNew().scale(planetRadius);
                //let offset2 = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(offset), rotation);
                vertexPosition = terrainFunction(vertPosVec, noiseLayers, craterFilter, planetRadius);
                // solving floating point precision
                //vertexPosition = vertexPosition.subtract(offset2);
                vertices.push(vertexPosition._x, vertexPosition._y, vertexPosition._z);
                //uvs.push(x / vertexPerLine, y / vertexPerLine);
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
        ComputeNormals(positions, indices, normals);
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
