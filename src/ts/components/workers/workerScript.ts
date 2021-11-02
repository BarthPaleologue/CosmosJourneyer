import { getRotationMatrixFromDirection } from "../toolbox/direction";
import { SimplexNoiseLayer } from "../terrain/landscape/simplexNoiseLayer";
import { ComputeNormals } from "../toolbox/computeNormals";
import { Vector } from "../toolbox/algebra";
import { MountainNoiseLayer } from "../terrain/landscape/moutainNoiseLayer";
import { ContinentNoiseLayer } from "../terrain/landscape/continentNoiseLayer";
import { CraterLayer } from "../terrain/crater/craterLayer";
import { buildData } from "../forge/buildData";
import { TerrainSettings } from "../terrain/terrainSettings";
import { CollisionData } from "../forge/CollisionData";

let bumpyLayer: SimplexNoiseLayer;
let continentsLayer2: SimplexNoiseLayer;
//let continentsLayer3: ContinentNoiseLayer;
let mountainsLayer: MountainNoiseLayer;

let terrainSettings: TerrainSettings = {
    continentsFragmentation: 0.5,

    maxBumpHeight: 0,
    bumpsFrequency: 1,

    maxMountainHeight: 0,
    mountainsFrequency: 1,
};


function initLayers() {
    bumpyLayer = new SimplexNoiseLayer(1e-4, 5, 2, 2, 0.0);
    continentsLayer2 = new SimplexNoiseLayer(5e-6, 5, 2, 2, 1 - terrainSettings.continentsFragmentation);
    //continentsLayer3 = new ContinentNoiseLayer(2e-5, 5, 1.5, 2, 0.0);
    mountainsLayer = new MountainNoiseLayer(2e-5, 5, 2.2, 2, 0.0);
}

initLayers();

const craterLayer = new CraterLayer([]);


function terrainFunction(p: Vector, planetRadius: number): Vector {

    const initialMagnitude = p.getMagnitude();

    // on se ramène à la position à la surface du globe (sans relief)
    const planetSpherePosition: Vector = p.scaleToNew(planetRadius / initialMagnitude);

    const unitCoords = planetSpherePosition.normalizeToNew();

    let elevation = 0;

    const craterMask = craterLayer.evaluate(unitCoords);

    elevation += craterMask;

    const continentMask = continentsLayer2.evaluate(planetSpherePosition);

    elevation += continentMask * mountainsLayer.evaluate(planetSpherePosition.scaleToNew(terrainSettings.mountainsFrequency)) * terrainSettings.maxMountainHeight;

    elevation += bumpyLayer.evaluate(planetSpherePosition.scaleToNew(terrainSettings.bumpsFrequency)) * terrainSettings.maxBumpHeight;

    const newPosition = p.addToNew(unitCoords.scaleToNew(elevation));

    return newPosition;
};

self.onmessage = e => {
    if (e.data.taskType == "buildTask") {
        //let clock = Date.now();

        const data = e.data as buildData;

        const chunkLength = data.chunkLength;
        const subs = data.subdivisions;
        const depth = data.depth;
        const direction = data.direction;
        const offset: number[] = data.position;

        craterLayer.craters = data.craters;

        terrainSettings = data.terrainSettings;

        initLayers();

        const size = chunkLength / (2 ** depth);
        const planetRadius = chunkLength / 2;

        const vertexPerLine = subs + 1;

        const rotationMatrix = getRotationMatrixFromDirection(direction);

        const verticesPositions = new Float32Array(vertexPerLine * vertexPerLine * 3);
        let faces: number[][] = [];

        for (let x = 0; x < vertexPerLine; ++x) {
            for (let y = 0; y < vertexPerLine; ++y) {

                // on crée un plan dans le plan Oxy
                let vertexPosition = new Vector((x - subs / 2) / subs, (y - subs / 2) / subs, 0);

                // on le met à la bonne taille
                vertexPosition = vertexPosition.scaleToNew(size);

                // on le met au bon endroit de la face par défaut (Oxy devant)
                let vecOffset = new Vector(...offset);
                vertexPosition = vertexPosition.addToNew(vecOffset);

                // on le met sur la bonne face
                vertexPosition = vertexPosition.applySquaredMatrixToNew(rotationMatrix);

                // on l'arrondi pour en faire un chunk de sphère
                let planetCoords = vertexPosition.normalizeToNew().scaleToNew(planetRadius);

                // on applique la fonction de terrain
                vertexPosition = terrainFunction(planetCoords, planetRadius);

                // on le ramène à l'origine
                vertexPosition = vertexPosition.addToNew(vecOffset.normalizeToNew().scaleToNew(-planetRadius));

                verticesPositions[(x * vertexPerLine + y) * 3] = vertexPosition.g(0);
                verticesPositions[(x * vertexPerLine + y) * 3 + 1] = vertexPosition.g(1);
                verticesPositions[(x * vertexPerLine + y) * 3 + 2] = vertexPosition.g(2);

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


        const indices = new Uint16Array(faces.length * (faces[0].length - 2) * 3);

        // indices from faces
        for (let i = 0; i < faces.length; ++i) {
            for (let j = 0; j < faces[i].length - 2; ++j) {
                indices[(i * (faces[i].length - 2) + j) * 3] = faces[i][0];
                indices[(i * (faces[i].length - 2) + j) * 3 + 1] = faces[i][j + 2];
                indices[(i * (faces[i].length - 2) + j) * 3 + 2] = faces[i][j + 1];
            }
        }

        const normals = new Float32Array(verticesPositions.length);

        ComputeNormals(verticesPositions, indices, normals);

        // information utilse sur les Float32Array : imprécision inhérente au bout d'une dizaine de chiffres (c'est un float32 quoi)
        // solution envisagée : float64 mais c'est dangereux

        self.postMessage({
            p: verticesPositions,
            i: indices,
            n: normals,
            //@ts-ignore
        }, [verticesPositions.buffer, indices.buffer, normals.buffer]);

        // benchmark fait le 5/10/2021 (normal non analytique) : ~2s/chunk
        //console.log("Time for creation : " + (Date.now() - clock));

    } else if (e.data.taskType == "collisionTask") {
        let data = e.data as CollisionData;

        craterLayer.craters = data.craters;
        terrainSettings = data.terrainSettings;

        let samplePosition = new Vector(...data.position).normalizeToNew().scaleToNew(data.chunkLength / 2);

        self.postMessage({
            h: terrainFunction(samplePosition, data.chunkLength / 2).getMagnitude(),
        });

    } else {
        console.error(`Type de tâche reçue invalide : ${e.data.taskType}`);
    }
};