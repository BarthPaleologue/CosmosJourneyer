import { getQuaternionFromDirection } from "../toolbox/direction";
import { simplexNoiseLayer } from "../terrain/landscape/simplexNoiseLayer";
import {Algebra, LVector3} from "../toolbox/algebra";
import { ridgedNoiseLayer } from "../terrain/landscape/ridgedNoiseLayer";
import { CraterLayer } from "../terrain/crater/craterLayer";
import { buildData } from "../forge/workerData";
import { TerrainSettings } from "../terrain/terrainSettings";
import { CollisionData } from "../forge/workerData";
import { elevationFunction } from "../terrain/landscape/elevationFunction";

let currentPlanetID = "";

let bumpyLayer: elevationFunction;
let continentsLayer: elevationFunction;
let mountainsLayer: elevationFunction;


let terrainSettings: TerrainSettings = {
    continentsFragmentation: 0.5,
    continentBaseHeight: 0,

    maxBumpHeight: 0,
    bumpsFrequency: 1,

    maxMountainHeight: 0,
    mountainsFrequency: 1,
    mountainsMinValue: 0.5,
};


function initLayers() {
    // TODO: ne pas hardcoder
    continentsLayer = simplexNoiseLayer(1e-6, 6, 1.8, 2.1, 0.5, 1 - terrainSettings.continentsFragmentation);

    bumpyLayer = simplexNoiseLayer(terrainSettings.bumpsFrequency, 3, 2, 2, 1.0, 0.2);

    mountainsLayer = ridgedNoiseLayer(terrainSettings.mountainsFrequency, 6, 1.9, 2.0, 2.5, terrainSettings.mountainsMinValue);
}

initLayers();

//const craterLayer = new CraterLayer([]);

function terrainFunction(position: LVector3, gradient: LVector3, seed = LVector3.Zero()): void {

    const unitCoords = position.normalize();

    let samplePoint = position.add(seed);

    let elevation = 0;

    let continentGradient = LVector3.Zero();
    let continentMask = continentsLayer(samplePoint, continentGradient);

    let continentElevation = continentMask * terrainSettings.continentBaseHeight;

    elevation += continentElevation;
    continentGradient.scaleInPlace(terrainSettings.continentBaseHeight);
    gradient.addInPlace(continentGradient);

    let mountainGradient = LVector3.Zero();
    let mountainElevation = mountainsLayer(samplePoint, mountainGradient);


    elevation += continentMask * mountainElevation * terrainSettings.maxMountainHeight;
    mountainGradient.scaleInPlace(terrainSettings.maxMountainHeight * continentMask);
    gradient.addInPlace(mountainGradient);

    let bumpyGradient = LVector3.Zero();
    let bumpyElevation = bumpyLayer(samplePoint, bumpyGradient);

    elevation += bumpyElevation * terrainSettings.maxBumpHeight;
    bumpyGradient.scaleInPlace(terrainSettings.maxBumpHeight);
    gradient.addInPlace(bumpyGradient);

    position.addInPlace(unitCoords.scale(elevation));

    gradient.divideInPlace(terrainSettings.continentBaseHeight + terrainSettings.maxMountainHeight + terrainSettings.maxBumpHeight);
}

self.onmessage = e => {
    if (e.data.taskType == "buildTask") {
        //let clock = Date.now();

        const data = e.data as buildData;

        const chunkLength = data.chunkLength;
        const subs = data.subdivisions;
        const depth = data.depth;
        const direction = data.direction;
        const chunkPosition: number[] = data.position;
        const seed = new LVector3(data.seed[0], data.seed[1], data.seed[2]);

        if (data.planetID != currentPlanetID) {
            currentPlanetID = data.planetID;

            //craterLayer.craters = data.craters;
            terrainSettings = data.terrainSettings;
            initLayers();
        }

        const size = chunkLength / (2 ** depth);
        const planetRadius = chunkLength / 2;

        const vertexPerLine = subs + 1;

        const rotationQuaternion = getQuaternionFromDirection(direction);

        const verticesPositions = new Float32Array(vertexPerLine * vertexPerLine * 3);
        let faces: number[][] = [];

        const normals = new Float32Array(verticesPositions.length);

        let vecchunkPosition = new LVector3(chunkPosition[0], chunkPosition[1], chunkPosition[2]);

        for (let x = 0; x < vertexPerLine; x++) {
            for (let y = 0; y < vertexPerLine; y++) {

                // on crée un plan dans le plan Oxy
                let vertexPosition = new LVector3(x - subs / 2, y - subs / 2, 0);

                // on le met à la bonne taille
                vertexPosition.scaleInPlace(size / subs);

                // on le met au bon endroit de la face par défaut (Oxy devant)
                vertexPosition.addInPlace(vecchunkPosition);

                // on le met sur la bonne face
                vertexPosition.applyQuaternionInPlace(rotationQuaternion);

                // Théorie : https://math.stackexchange.com/questions/1071662/surface-normal-to-point-on-displaced-sphere

                // on l'arrondi pour en faire un chunk de sphère
                let unitSphereCoords = vertexPosition.normalize();

                vertexPosition.setMagnitudeInPlace(planetRadius);

                // on applique la fonction de terrain
                let vertexGradient = LVector3.Zero();
                terrainFunction(vertexPosition, vertexGradient, seed);

                let h = vertexGradient;
                h.subtractInPlace(unitSphereCoords.scale(Algebra.Dot(vertexGradient, unitSphereCoords)));

                let vertexNormal = unitSphereCoords.subtract(h);
                vertexNormal.normalizeInPlace();

                // on le ramène à l'origine
                let offset = vecchunkPosition.clone();
                offset.setMagnitudeInPlace(planetRadius);
                vertexPosition.subtractInPlace(offset);

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

        // indices from faces (magie noire)
        for (let i = 0; i < faces.length; ++i) {
            for (let j = 0; j < faces[i].length - 2; ++j) {
                // on à noter que le 0 m'intrigue
                indices[(i * (faces[i].length - 2) + j) * 3] = faces[i][0];
                indices[(i * (faces[i].length - 2) + j) * 3 + 1] = faces[i][j + 2];
                indices[(i * (faces[i].length - 2) + j) * 3 + 2] = faces[i][j + 1];
            }
        }

        const grassPositions = new Float32Array(100 * 3 * 0);

        //vecchunkPosition.applyQuaternionInPlace(rotationQuaternion);

        /*for (let i = 0; i < 100; ++i) {
            let x = vecchunkPosition.x + Math.random() * size - size / 2;
            let y = vecchunkPosition.y + Math.random() * size - size / 2;
            let z = vecchunkPosition.z + Math.random() * size - size / 2;
            let mag = Math.sqrt(x * x + y * y + z * z);
            let gp = new Vector3(x, y, z);
            gp.divideInPlace(mag);
            gp.scaleInPlace(planetRadius);

            terrainFunction(gp, new Vector3(1, 1, 1));

            gp.addInPlace(gp.normalize().scale(100 / 2));
            gp.subtractInPlace(vecchunkPosition);

            //gp = gp.normalize().scale(planetRadius * 1.01);

            grassPositions[i * 3] = gp.x;
            grassPositions[i * 3 + 1] = gp.y;
            grassPositions[i * 3 + 2] = gp.z;
        }*/

        self.postMessage({
            p: verticesPositions,
            i: indices,
            n: normals,
            g: grassPositions
            //@ts-ignore
        }, [verticesPositions.buffer, indices.buffer, normals.buffer, grassPositions.buffer]);

        // benchmark fait le 5/10/2021 (normale non analytique) : ~2s/chunk
        // benchmark fait le 12/11/2021 (normale non analyique) : ~0.5s/chunk
        // benchmark fait le 20/11/2021 20h30 (normale analytique v2) : ~0.8s/chunk
        // benchmark fait le 20/11/2021 21h20 (normale analytique v2.1) : ~0.03s/chunk (30ms/chunk)
        // benchmark fait le 10/12/2021 (normale analytique v2.5) : ~ 50ms/chunk
        // benchmark fait le 19/02/2022 (normale analytique v2.6) : ~ 40ms/chunk
        //console.log("Time for creation : " + (Date.now() - clock));

    } else if (e.data.taskType == "collisionTask") {
        let data = e.data as CollisionData;

        if (data.planetID != currentPlanetID) {
            currentPlanetID = data.planetID;

            //craterLayer.craters = data.craters;
            terrainSettings = data.terrainSettings;
            initLayers();
        }

        let samplePosition = new LVector3(data.position[0], data.position[1], data.position[2]);
        samplePosition.normalizeInPlace();
        samplePosition.scaleInPlace(data.chunkLength / 2);

        terrainFunction(samplePosition, LVector3.Zero());

        self.postMessage({
            h: samplePosition.getMagnitude(),
        });

    } else {
        console.error(`Type de tâche reçue invalide : ${e.data.taskType}`);
    }
};