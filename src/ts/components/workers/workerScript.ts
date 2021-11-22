import { getRotationMatrixFromDirection } from "../toolbox/direction";
import { simplexNoiseLayer } from "../terrain/landscape/simplexNoiseLayer";
import { Vector3 } from "../toolbox/algebra";
import { ridgedNoiseLayer } from "../terrain/landscape/ridgedNoiseLayer";
import { CraterLayer } from "../terrain/crater/craterLayer";
import { buildData } from "../forge/buildData";
import { TerrainSettings } from "../terrain/terrainSettings";
import { CollisionData } from "../forge/CollisionData";
import { elevationFunction } from "../terrain/landscape/elevationFunction";

let currentPlanetID = "";

let bumpyLayer: elevationFunction;
let continentsLayer: elevationFunction;
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
    continentsLayer = simplexNoiseLayer(3e-6, 6, 1.8, 2.1, 1 - terrainSettings.continentsFragmentation);

    bumpyLayer = simplexNoiseLayer(1e-3, 3, 2, 2, 0.0);

    mountainsLayer = ridgedNoiseLayer(3e-4, 6, 1.5, 2, 0.6);
}

initLayers();

const craterLayer = new CraterLayer([]);

function terrainFunction(position: Vector3, gradient: Vector3): void {

    const unitCoords = position.normalize();

    let elevation = 0;

    let continentBaseHeight = 5e3;

    let continentData = continentsLayer(position);
    let continentMask = continentData[0];

    let continentGradient = new Vector3(continentData[1], continentData[2], continentData[3]);

    // la racine permet l'effet de "plateau" continental
    // https://www.wikiwand.com/en/Gradient
    // pour que cela marche : appliquer la fonction suivant la composante normale à la sphère
    continentMask = Math.sqrt(continentMask);
    continentGradient.divideInPlace(2 * continentMask);

    let continentElevation = continentMask * continentBaseHeight;

    elevation += continentElevation;
    continentGradient.scaleInPlace(continentBaseHeight);
    gradient.addInPlace(continentGradient);

    let mountainData = mountainsLayer(position.scale(terrainSettings.mountainsFrequency));
    let mountainElevation = continentMask * mountainData[0];
    let mountainGradient = new Vector3(mountainData[1], mountainData[2], mountainData[3]);

    elevation += continentMask * mountainElevation * terrainSettings.maxMountainHeight;
    mountainGradient.scaleInPlace(terrainSettings.maxMountainHeight * continentMask);
    gradient.addInPlace(mountainGradient);

    let bumpyData = bumpyLayer(position.scale(terrainSettings.bumpsFrequency));
    let bumpyElevation = bumpyData[0];
    let bumpyGradient = new Vector3(bumpyData[1], bumpyData[2], bumpyData[3]);

    elevation += bumpyElevation * terrainSettings.maxBumpHeight;
    bumpyGradient.scaleInPlace(terrainSettings.maxBumpHeight);
    gradient.addInPlace(bumpyGradient);

    position.addInPlace(unitCoords.scale(elevation));

    gradient.divideInPlace(continentBaseHeight + terrainSettings.maxMountainHeight + terrainSettings.maxBumpHeight);
    //gradient.divideInPlace(elevation);
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

        let vecOffset = new Vector3(offset[0], offset[1], offset[2]);

        for (let x = 0; x < vertexPerLine; ++x) {
            for (let y = 0; y < vertexPerLine; ++y) {

                // on crée un plan dans le plan Oxy
                let vertexPosition = new Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);

                // on le met à la bonne taille
                vertexPosition.scaleInPlace(size);

                // on le met au bon endroit de la face par défaut (Oxy devant)
                vertexPosition.addInPlace(vecOffset);

                // on le met sur la bonne face
                vertexPosition.applyMatrixInPlace(rotationMatrix);

                // Théorie : https://math.stackexchange.com/questions/1071662/surface-normal-to-point-on-displaced-sphere

                // on l'arrondi pour en faire un chunk de sphère
                let unitSphereCoords = vertexPosition.normalize();
                vertexPosition = unitSphereCoords.scale(planetRadius);
                // on applique la fonction de terrain
                let vertexGradient = Vector3.Zero();
                terrainFunction(vertexPosition, vertexGradient);

                let h = vertexGradient.subtract(unitSphereCoords.scale(Vector3.Dot(vertexGradient, unitSphereCoords)));

                let vertexNormal = unitSphereCoords.subtract(h).normalize();

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

        // indices from faces (magie noire)
        for (let i = 0; i < faces.length; ++i) {
            for (let j = 0; j < faces[i].length - 2; ++j) {
                // on à noter que le 0 m'intrigue
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
        // benchmark fait le 20/11/2021 21h20 (normal analytique v2.1) : ~0.03s/chunk (30ms/chunk)
        //console.log("Time for creation : " + (Date.now() - clock));

    } else if (e.data.taskType == "collisionTask") {
        let data = e.data as CollisionData;

        if (data.planetID != currentPlanetID) {
            currentPlanetID = data.planetID;

            craterLayer.craters = data.craters;
            terrainSettings = data.terrainSettings;
            initLayers();
        }

        let samplePosition = new Vector3(data.position[0], data.position[1], data.position[2]);
        samplePosition.normalizeInPlace();
        samplePosition.scaleInPlace(data.chunkLength / 2);

        terrainFunction(samplePosition, Vector3.Zero());

        self.postMessage({
            h: samplePosition.getMagnitude(),
        });

    } else {
        console.error(`Type de tâche reçue invalide : ${e.data.taskType}`);
    }
};