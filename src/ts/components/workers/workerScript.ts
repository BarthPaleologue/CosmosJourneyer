import { getRotationMatrixFromDirection } from "../toolbox/direction";
import { simplexNoiseLayer } from "../terrain/landscape/simplexNoiseLayer";
import { Vector3 } from "../toolbox/algebra";
import { mountainNoiseLayer } from "../terrain/landscape/moutainNoiseLayer";
import { continentNoiseLayer } from "../terrain/landscape/continentNoiseLayer";
import { CraterLayer } from "../terrain/crater/craterLayer";
import { buildData } from "../forge/buildData";
import { TerrainSettings } from "../terrain/terrainSettings";
import { CollisionData } from "../forge/CollisionData";
import { elevationFunction } from "../terrain/landscape/elevationFunction";

let currentPlanetID = "";

let bumpyLayer: elevationFunction;
let continentsLayer2: elevationFunction;
//let continentsLayer3: ContinentNoiseLayer;
let mountainsLayer: elevationFunction;

let terrainSettings: TerrainSettings = {
    continentsFragmentation: 0.5,

    maxBumpHeight: 0,
    bumpsFrequency: 1,

    maxMountainHeight: 0,
    mountainsFrequency: 1,
};


function initLayers() {
    bumpyLayer = simplexNoiseLayer(7e-5, 2, 2, 2, 0.0);
    continentsLayer2 = simplexNoiseLayer(5e-6, 3, 1.7, 2.5, 1 - terrainSettings.continentsFragmentation);
    //continentsLayer3 = new ContinentNoiseLayer(2e-5, 5, 1.5, 2, 0.0);
    mountainsLayer = mountainNoiseLayer(1e-4, 5, 2, 2, 0.4);
}

initLayers();

const craterLayer = new CraterLayer([]);

function terrainFunction(position: Vector3, normal: Vector3): void {

    const unitCoords = position.normalize();

    let elevation = 0;

    let continentMask = continentsLayer2(position.scale(0.5))[0];

    let mountainData = mountainsLayer(position.scale(terrainSettings.mountainsFrequency));
    let mountainElevation = mountainData[0];
    let mountainNormal = new Vector3(mountainData[1], mountainData[2], mountainData[3]);

    elevation += continentMask * mountainElevation * terrainSettings.maxMountainHeight;
    mountainNormal.scaleInPlace(terrainSettings.maxMountainHeight * continentMask);
    normal.addInPlace(mountainNormal);

    let bumpyData = bumpyLayer(position.scale(terrainSettings.bumpsFrequency));
    let bumpyElevation = bumpyData[0];
    let bumpyNormal = new Vector3(bumpyData[1], bumpyData[2], bumpyData[3]);

    elevation += bumpyElevation * terrainSettings.maxBumpHeight;
    bumpyNormal.scaleInPlace(terrainSettings.maxBumpHeight);
    normal.addInPlace(bumpyNormal);

    position.addInPlace(unitCoords.scale(elevation));

    normal.divideInPlace(terrainSettings.maxMountainHeight + terrainSettings.maxBumpHeight);
}

self.onmessage = e => {
    if (e.data.taskType == "buildTask") {
        //let clock = Date.now();

        const data = e.data as buildData;

        const chunkLength = data.chunkLength;
        const subs = data.subdivisions;
        const depth = data.depth;
        const direction = data.direction;
        const offset: number[] = data.position;

        if (data.planetID != currentPlanetID) {
            currentPlanetID = data.planetID;

            craterLayer.craters = data.craters;
            terrainSettings = data.terrainSettings;
            initLayers();
        }

        const size = chunkLength / (2 ** depth);
        const planetRadius = chunkLength / 2;

        const vertexPerLine = subs + 1;

        const rotationMatrix = getRotationMatrixFromDirection(direction);

        const verticesPositions = new Float32Array(vertexPerLine * vertexPerLine * 3);
        let faces: number[][] = [];

        const normals = new Float32Array(verticesPositions.length);


        for (let x = 0; x < vertexPerLine; ++x) {
            for (let y = 0; y < vertexPerLine; ++y) {

                // on crée un plan dans le plan Oxy
                let vertexPosition = new Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);

                // on le met à la bonne taille
                vertexPosition.scaleInPlace(size);

                // on le met au bon endroit de la face par défaut (Oxy devant)
                let vecOffset = new Vector3(offset[0], offset[1], offset[2]);
                vertexPosition.addInPlace(vecOffset);

                // on le met sur la bonne face
                vertexPosition.applyMatrixInPlace(rotationMatrix);

                // on l'arrondi pour en faire un chunk de sphère
                let unitSphereCoords = vertexPosition.normalize();
                vertexPosition = unitSphereCoords.scale(planetRadius);
                // on applique la fonction de terrain
                let vertexNormal = Vector3.Zero();
                terrainFunction(vertexPosition, vertexNormal);

                vertexNormal = unitSphereCoords.subtract(vertexNormal).normalize();

                // on le ramène à l'origine
                vertexPosition.addInPlace(vecOffset.normalize().scale(-planetRadius));

                verticesPositions[(x * vertexPerLine + y) * 3] = vertexPosition.x;
                verticesPositions[(x * vertexPerLine + y) * 3 + 1] = vertexPosition.y;
                verticesPositions[(x * vertexPerLine + y) * 3 + 2] = vertexPosition.z;

                normals[(x * vertexPerLine + y) * 3] = vertexNormal.x;
                normals[(x * vertexPerLine + y) * 3 + 1] = vertexNormal.y;
                normals[(x * vertexPerLine + y) * 3 + 2] = vertexNormal.z;

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

        self.postMessage({
            p: verticesPositions,
            i: indices,
            n: normals,
            //@ts-ignore
        }, [verticesPositions.buffer, indices.buffer, normals.buffer]);

        // benchmark fait le 5/10/2021 (normal non analytique) : ~2s/chunk
        // benchmark fait le 12/11/2021 (normal non analyique) : ~0.5s/chunk
        // benchmark fait le 20/11/2021 20h30 (normal analytique v2) : ~0.8s/chunk
        // benchmark fait le 20/11/2021 21h20 (normal analytique v2.1) : ~0.06s/chunk (30ms/chunk)
        //console.log("Time for creation : " + (Date.now() - clock));

    } else if (e.data.taskType == "collisionTask") {
        let data = e.data as CollisionData;

        if (data.planetID != currentPlanetID) {
            currentPlanetID = data.planetID;

            craterLayer.craters = data.craters;
            terrainSettings = data.terrainSettings;
            initLayers();
        }

        let samplePosition = new Vector3(data.position[0], data.position[1], data.position[2]).normalize().scale(data.chunkLength / 2);

        terrainFunction(samplePosition, Vector3.Zero());

        self.postMessage({
            h: samplePosition.getMagnitude(),
        });

    } else {
        console.error(`Type de tâche reçue invalide : ${e.data.taskType}`);
    }
};