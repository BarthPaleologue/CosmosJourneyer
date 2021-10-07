import { Direction } from "../toolbox/direction";
import { SimplexNoiseLayer } from "../terrain/landscape/simplexNoiseLayer";
import { CraterFilter } from "../terrain/crater/craterFilter";
import { ComputeNormals } from "../toolbox/computeNormals";
import { Matrix3, Vector3 } from "../toolbox/algebra";
import { NoiseModifiers } from "../terrain/landscape/noiseSettings";
import { CraterModifiers } from "../terrain/crater/craterModifiers";
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
//let continentsLayer3: ContinentNoiseLayer;
let mountainsLayer2: MountainNoiseLayer;

function initLayers() {
    bumpyLayer = new SimplexNoiseLayer(1e-4, 5, 2, 2, 0.0);
    continentsLayer2 = new SimplexNoiseLayer(5e-6, 5, 1.8, 2, noiseModifiers.archipelagoFactor);
    //continentsLayer3 = new ContinentNoiseLayer(2e-5, 5, 1.5, 2, 0.0);
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
        //let clock = Date.now();

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

        let verticesPositions = new Float32Array(vertexPerLine * vertexPerLine * 3);
        let faces: number[][] = [];

        for (let x = 0; x < vertexPerLine; x++) {
            for (let y = 0; y < vertexPerLine; y++) {
                let vertexPosition = new Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);

                vertexPosition = vertexPosition.scaleToNew(size);

                let vecOffset = Vector3.FromArray(offset);
                vertexPosition = vertexPosition.addToNew(vecOffset);

                vertexPosition = vertexPosition.applyMatrixToNew(rotation);

                vertexPosition = vertexPosition.normalizeToNew().scaleToNew(planetRadius);

                vertexPosition = terrainFunction(vertexPosition, craterFilter, planetRadius);

                verticesPositions[(x * vertexPerLine + y) * 3] = vertexPosition._x;
                verticesPositions[(x * vertexPerLine + y) * 3 + 1] = vertexPosition._y;
                verticesPositions[(x * vertexPerLine + y) * 3 + 2] = vertexPosition._z;

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


        let indices = new Uint16Array(faces.length * (faces[0].length - 2) * 3);

        // indices from faces
        for (let i = 0; i < faces.length; ++i) {
            for (let j = 0; j < faces[i].length - 2; ++j) {
                indices[(i * (faces[i].length - 2) + j) * 3] = faces[i][0];
                indices[(i * (faces[i].length - 2) + j) * 3 + 1] = faces[i][j + 2];
                indices[(i * (faces[i].length - 2) + j) * 3 + 2] = faces[i][j + 1];
            }
        }

        let normals = new Float32Array(verticesPositions.length);

        ComputeNormals(verticesPositions, indices, normals);

        // information utilse sur les Float32Array : imprécision inhérente au bout d'une dizaine de chiffres (c'est un float32 quoi)
        // solution envisagée : float64 mais c'est dangereux

        postMessage({
            p: verticesPositions,
            i: indices,
            n: normals,
            //@ts-ignore
        }, [verticesPositions.buffer, indices.buffer, normals.buffer]);

        // benchmark fait le 5/10/2021 (normal non analytique) : ~2s/chunk
        //console.log("Time for creation : " + (Date.now() - clock));

    } else {
        console.error(`Type de tâche reçue invalide : ${e.data.taskType}`);
    }
};