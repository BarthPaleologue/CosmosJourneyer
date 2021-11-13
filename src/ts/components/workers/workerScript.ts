import { getRotationMatrixFromDirection } from "../toolbox/direction";
import { simplexNoiseLayer } from "../terrain/landscape/simplexNoiseLayer";
import { Vector } from "../toolbox/algebra";
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

function terrainFunction(p: Vector): Vector {

    // on se ramène à la position à la surface du globe (sans relief)
    const planetSpherePosition = p;

    const unitCoords = p.normalize();

    let elevation = 0;

    //const craterMask = craterLayer.evaluate(unitCoords);

    //elevation += craterMask;

    const continentMask = continentsLayer2(planetSpherePosition);

    elevation += continentMask * (1 + mountainsLayer(planetSpherePosition.scale(terrainSettings.mountainsFrequency))) * terrainSettings.maxMountainHeight / 2;

    elevation += bumpyLayer(planetSpherePosition.scale(terrainSettings.bumpsFrequency)) * terrainSettings.maxBumpHeight;

    //elevation += openSimplex301(planetSpherePosition.scale(0.00003)) * 10000;

    const newPosition = p.add(unitCoords.scale(elevation));

    return newPosition;
};

// check pdf file in ./doc
function normalAtSpherePoint(p: Vector): Vector {
    if (p.dim != 3) throw Error("normalAtSphere expects 3d position vector !");

    let sphereNormal = p.normalize();
    let a = sphereNormal.x;
    let b = sphereNormal.y;
    let c = sphereNormal.z;

    let dir1 = new Vector(b, -a, 0);
    if (dir1.isZero()) dir1 = new Vector(c, 0, -a);
    if (dir1.isZero()) dir1 = new Vector(0, c, -b);
    dir1.normalizeInPlace();
    let dir2 = crossProduct(p, dir1);

    const epsilon = 1;
    dir1.scaleInPlace(epsilon);
    dir2.scaleInPlace(epsilon);

    let p1 = terrainFunction(p.add(dir1));
    let p2 = terrainFunction(p.subtract(dir1));

    let p3 = terrainFunction(p.add(dir2));
    let p4 = terrainFunction(p.subtract(dir2));

    let t1 = p1.subtract(p2).divide(2 * epsilon);
    let t2 = p3.subtract(p4).divide(2 * epsilon);

    let normal = crossProduct(t1, t2).normalize();

    return normal;
}

function crossProduct(v1: Vector, v2: Vector): Vector {
    if (v1.dim != v2.dim || v1.dim != 3 || v2.dim != 3) throw Error("Cross Product for 3D vectors only");

    let x = v1.y * v2.z - v1.z * v2.y;
    let y = v1.z * v2.x - v1.x * v2.z;
    let z = v1.x * v2.y - v1.y * v2.x;

    return new Vector(x, y, z);
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
                let vertexPosition = new Vector((x - subs / 2) / subs, (y - subs / 2) / subs, 0);

                // on le met à la bonne taille
                vertexPosition.scaleInPlace(size);

                // on le met au bon endroit de la face par défaut (Oxy devant)
                let vecOffset = new Vector(...offset);
                vertexPosition.addInPlace(vecOffset);

                // on le met sur la bonne face
                vertexPosition.applySquaredMatrixInPlace(rotationMatrix);

                // on l'arrondi pour en faire un chunk de sphère
                let planetCoords = vertexPosition.normalize().scale(planetRadius);

                // on applique la fonction de terrain
                vertexPosition = terrainFunction(planetCoords);

                let vertexNormal = normalAtSpherePoint(planetCoords);

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
                    /*faces.push([
                        x * vertexPerLine + y,
                        x * vertexPerLine + y + 1,
                        (x + 1) * vertexPerLine + y,
                    ]);
                    faces.push([
                        (x + 1) * vertexPerLine + y,
                        x * vertexPerLine + y + 1,
                        (x + 1) * vertexPerLine + y + 1
                    ]);*/
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
        //console.log("Time for creation : " + (Date.now() - clock));

    } else if (e.data.taskType == "collisionTask") {
        let data = e.data as CollisionData;

        if (data.planetID != currentPlanetID) {
            currentPlanetID = data.planetID;

            craterLayer.craters = data.craters;
            terrainSettings = data.terrainSettings;
            initLayers();
        }

        let samplePosition = new Vector(...data.position).normalize().scale(data.chunkLength / 2);

        self.postMessage({
            h: terrainFunction(samplePosition).getMagnitude(),
        });

    } else {
        console.error(`Type de tâche reçue invalide : ${e.data.taskType}`);
    }
};