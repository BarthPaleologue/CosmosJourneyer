import { Direction } from "../toolbox/direction";
import { SimplexNoiseLayer } from "../terrain/landscape/simplexNoiseLayer";
import { CraterFilter } from "../terrain/crater/craterFilter";
import { ComputeNormals } from "../toolbox/computeNormals";
import { Matrix3, Vector3 } from "../toolbox/algebra";
import { NoiseModifiers } from "./layers/noiseSettings";
import { CraterModifiers } from "./layers/craterModifiers";
import { MountainNoiseLayer } from "../terrain/landscape/moutainNoiseLayer";
import { ContinentNoiseLayer } from "../terrain/landscape/continentNoiseLayer";


let craterModifiers: CraterModifiers = {
    radiusModifier: 1,
    steepnessModifier: 1,
    maxDepthModifier: 1,
    scaleFactor: 1,
};

let noiseModifiers: NoiseModifiers = {
    amplitudeModifier: 1,
    offsetModifier: [0, 0, 0],
    frequencyModifier: 1,
    minValueModifier: 1,

    archipelagoFactor: 0.5,
};

let bumpyLayer: SimplexNoiseLayer;
let continentsLayer2: SimplexNoiseLayer;
let continentsLayer3: ContinentNoiseLayer;
let mountainsLayer2: MountainNoiseLayer;

function initLayers() {
    bumpyLayer = new SimplexNoiseLayer(1e-4, 5, 2, 2, 0.0);
    continentsLayer2 = new SimplexNoiseLayer(5e-6, 5, 1.8, 2, noiseModifiers.archipelagoFactor);
    continentsLayer3 = new ContinentNoiseLayer(2e-5, 5, 1.5, 2, 0.0);
    mountainsLayer2 = new MountainNoiseLayer(2e-5, 6, 2, 2, 0.0);
}

initLayers();

let craterFilter = new CraterFilter([]);

let moutainHeight = 10000;
let bumpyHeight = 300;

function terrainFunction(p: Vector3, craterFilter: CraterFilter, planetRadius: number): Vector3 {

    let initialPosition = [p._x, p._y, p._z];
    let initialMagnitude = Math.sqrt(initialPosition[0] ** 2 + initialPosition[1] ** 2 + initialPosition[2] ** 2);

    // on se ramène à la position à la surface du globe (sans relief)
    initialPosition = initialPosition.map((value: number) => value * planetRadius / initialMagnitude);

    let coords = Vector3.FromArray(initialPosition); // p.normalizeToNew().scale(planetRadius);
    let unitCoords = coords.normalizeToNew().scaleToNew(noiseModifiers.frequencyModifier);

    let elevation = 0;

    let craterMask = craterFilter.evaluate(unitCoords, craterModifiers) / 20;

    elevation += craterMask;

    let continentMask = continentsLayer2.evaluate(coords);
    //if (continentMask < 0.1) continentMask = 0;

    elevation += continentMask * mountainsLayer2.evaluate(coords) * moutainHeight;

    elevation += bumpyLayer.evaluate(coords) * bumpyHeight;

    let newPosition = p.addToNew(unitCoords.scaleToNew(elevation));

    return new Vector3(newPosition._x, newPosition._y, newPosition._z);
};

onmessage = e => {
    if (e.data.taskType == "buildTask") {

        let chunkLength = e.data.chunkLength;
        let subs = e.data.subdivisions;
        let depth = e.data.depth;
        let direction = e.data.direction;
        let offset: number[] = e.data.position;

        craterFilter.setCraters(e.data.craters);

        noiseModifiers = e.data.noiseModifiers;

        craterModifiers = e.data.craterModifiers;

        initLayers();

        let size = chunkLength / (2 ** depth);
        let planetRadius = chunkLength / 2;

        let vertices: number[] = [];
        let faces: number[][] = [];
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
        let indices: number[] = [];
        let normals: number[] = [];

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
            //@ts-ignore
        }, [tPositions.buffer, tIndices.buffer, tNormals.buffer]);
    } else {
        console.log(`Tâche reçue : ${e.data.taskType}`);
    }
};