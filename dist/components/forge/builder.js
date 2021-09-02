import { Direction } from "./direction.js";
import { NoiseLayer } from "./layers/noiseLayer.js";
import { CraterFilter } from "./layers/filters/craterFilter.js";
import { ComputeNormals } from "./computeNormals.js";
import { Matrix3, Vector3 } from "./algebra.js";
let bumpyLayer = new NoiseLayer(1e-4, 5, 2, 2, 0.0);
let continentsLayer2 = new NoiseLayer(5e-6, 2, 2, 2, 0.2);
let mountainsLayer2 = new NoiseLayer(5e-5, 5, 2, 2, 0.0);
let craterFilter = new CraterFilter([]);
let craterModifiers = {
    radiusModifier: 1,
    steepnessModifier: 1,
    maxDepthModifier: 1,
    scaleFactor: 1,
};
function terrainFunction(p, craterFilter, planetRadius) {
    let initialPosition = [p._x, p._y, p._z];
    let initialMagnitude = Math.sqrt(Math.pow(initialPosition[0], 2) + Math.pow(initialPosition[1], 2) + Math.pow(initialPosition[2], 2));
    // on se ramène à la position à la surface du globe (sans relief)
    initialPosition = initialPosition.map((value) => value * planetRadius / initialMagnitude);
    let coords = Vector3.FromArray(initialPosition); // p.normalizeToNew().scale(planetRadius);
    let unitCoords = coords.normalizeToNew();
    let elevation = 0;
    let craterMask = craterFilter.evaluate(unitCoords, craterModifiers) / 20;
    elevation += craterMask;
    /*for (let layer of noiseLayers) {
        let maskFactor = 1;
        for (let i = 0; i < layer.masks.length; i++) {
            maskFactor *= noiseLayers[i].evaluate(coords, noiseModifiers);
        }
        if (layer.settings.useCraterMask && craterMask != 0) maskFactor = 0;
        elevation += layer.evaluate(coords, noiseModifiers) * maskFactor;
    }*/
    elevation += continentsLayer2.evaluate(coords) * mountainsLayer2.evaluate(coords) * 7000;
    elevation += bumpyLayer.evaluate(coords) * 500;
    let newPosition = p.addToNew(unitCoords.scaleToNew(elevation));
    return new Vector3(newPosition._x, newPosition._y, newPosition._z);
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
        //noiseModifiers = e.data.noiseModifiers;
        craterModifiers = e.data.craterModifiers;
        let size = chunkLength / (Math.pow(2, depth));
        let planetRadius = chunkLength / 2;
        let vertices = [];
        let faces = [];
        //let uvs: number[] = [];
        let vertexPerLine = subs + 1;
        let rotation = Matrix3.Identity();
        switch (direction) {
            case Direction.Up:
                rotation = Matrix3.RotationX(-Math.PI / 2);
                break;
            case Direction.Down:
                rotation = Matrix3.RotationX(Math.PI / 2);
                break;
            case Direction.Forward:
                rotation = Matrix3.Identity();
                break;
            case Direction.Backward:
                rotation = Matrix3.RotationY(-Math.PI);
                break;
            case Direction.Left:
                rotation = Matrix3.RotationY(Math.PI / 2);
                break;
            case Direction.Right:
                rotation = Matrix3.RotationY(-Math.PI / 2);
                break;
        }
        for (let x = 0; x < vertexPerLine; x++) {
            for (let y = 0; y < vertexPerLine; y++) {
                let vertexPosition = new Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
                vertexPosition = vertexPosition.scaleToNew(size);
                let vecOffset = Vector3.FromArray(offset);
                vertexPosition = vertexPosition.addToNew(vecOffset);
                vertexPosition = vertexPosition.applyMatrixToNew(rotation);
                vertexPosition = vertexPosition.normalizeToNew().scaleToNew(planetRadius);
                //let offset2 = BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(offset), rotation);
                vertexPosition = terrainFunction(vertexPosition, craterFilter, planetRadius);
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
