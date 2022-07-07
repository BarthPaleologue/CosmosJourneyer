import { getQuaternionFromDirection } from "../utils/direction";
import { LVector3 } from "../utils/algebra";
import { BuildData, CollisionData, WorkerData } from "../chunks/workerDataInterfaces";
import { TaskType } from "../chunks/taskInterfaces";
import { makeTerrainFunction, TerrainFunction } from "../terrain/makeTerrainFunction";

let currentPlanetID = "";

let terrainFunction: TerrainFunction;

function buildChunkVertexData(data: BuildData): void {
    const planetDiameter = data.planetDiameter;
    const depth = data.depth;
    const direction = data.direction;
    const chunkFrontFacePosition = new LVector3(data.position[0], data.position[1], data.position[2]);
    const seed = data.seed;

    if (data.planetName != currentPlanetID) {
        currentPlanetID = data.planetName;
        terrainFunction = makeTerrainFunction(data.terrainSettings);
    }

    const chunkSize = planetDiameter / 2 ** depth;
    const planetRadius = planetDiameter / 2;

    const nbVerticesPerSide = data.nbVerticesPerSide;
    const nbSubdivisions = nbVerticesPerSide - 1;

    const rotationQuaternion = getQuaternionFromDirection(direction);

    const verticesPositions = new Float32Array(nbVerticesPerSide * nbVerticesPerSide * 3);
    const faces: number[][] = [];

    const normals = new Float32Array(verticesPositions.length);

    // the offset used to bring back the vertices close to the origin (the position of the chunk on the sphere)
    const chunkSpherePosition = chunkFrontFacePosition.clone();
    chunkSpherePosition.applyRotationQuaternionInPlace(rotationQuaternion);
    chunkSpherePosition.setMagnitudeInPlace(planetRadius);

    for (let x = 0; x < nbVerticesPerSide; x++) {
        for (let y = 0; y < nbVerticesPerSide; y++) {
            // on crée un plan dans le plan Oxy
            const vertexPosition = new LVector3(x - nbSubdivisions / 2, y - nbSubdivisions / 2, 0);

            // on le met à la bonne taille
            vertexPosition.scaleInPlace(chunkSize / nbSubdivisions);

            // on le met au bon endroit de la face par défaut (Oxy devant)
            vertexPosition.addInPlace(chunkFrontFacePosition);

            // on le met sur la bonne face
            vertexPosition.applyRotationQuaternionInPlace(rotationQuaternion);

            // Théorie : https://math.stackexchange.com/questions/1071662/surface-normal-to-point-on-displaced-sphere

            // on l'arrondi pour en faire un chunk de sphère
            const unitSphereCoords = vertexPosition.normalizeToNew();

            vertexPosition.setMagnitudeInPlace(planetRadius);

            // on applique la fonction de terrain
            const vertexGradient = LVector3.Zero();
            terrainFunction(unitSphereCoords, seed, vertexPosition, vertexGradient);

            const h = vertexGradient;
            h.subtractInPlace(unitSphereCoords.scale(LVector3.Dot(vertexGradient, unitSphereCoords)));

            const vertexNormal = unitSphereCoords.subtract(h);
            vertexNormal.normalizeInPlace();

            // on le ramène à l'origine
            vertexPosition.subtractInPlace(chunkSpherePosition);

            verticesPositions[(x * nbVerticesPerSide + y) * 3] = vertexPosition.x;
            verticesPositions[(x * nbVerticesPerSide + y) * 3 + 1] = vertexPosition.y;
            verticesPositions[(x * nbVerticesPerSide + y) * 3 + 2] = vertexPosition.z;

            normals[(x * nbVerticesPerSide + y) * 3] = vertexNormal.x;
            normals[(x * nbVerticesPerSide + y) * 3 + 1] = vertexNormal.y;
            normals[(x * nbVerticesPerSide + y) * 3 + 2] = vertexNormal.z;

            if (x >= nbVerticesPerSide - 1 || y >= nbVerticesPerSide - 1) continue;

            faces.push([x * nbVerticesPerSide + y, x * nbVerticesPerSide + y + 1, (x + 1) * nbVerticesPerSide + y + 1, (x + 1) * nbVerticesPerSide + y]);
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

    self.postMessage(
        {
            p: verticesPositions,
            i: indices,
            n: normals
        },
        //@ts-ignore
        [verticesPositions.buffer, indices.buffer, normals.buffer]
    );
}

function sendHeightAtPoint(point: LVector3, seed: number): void {
    terrainFunction(point.normalizeToNew(), seed, point, LVector3.Zero());

    self.postMessage({
        h: point.getMagnitude()
    });
}

self.onmessage = (e) => {
    const data: WorkerData = e.data;

    switch (data.taskType) {
        case TaskType.Build:
            //let clock = Date.now();
            buildChunkVertexData(e.data as BuildData);

            //console.log("Time for creation : " + (Date.now() - clock));
            // benchmark fait le 5/10/2021 (normale non analytique) : ~2s/chunk
            // benchmark fait le 12/11/2021 (normale non analyique) : ~0.5s/chunk
            // benchmark fait le 20/11/2021 20h30 (normale analytique v2) : ~0.8s/chunk
            // benchmark fait le 20/11/2021 21h20 (normale analytique v2.1) : ~0.03s/chunk (30ms/chunk)
            // benchmark fait le 10/12/2021 (normale analytique v2.5) : ~ 50ms/chunk
            // benchmark fait le 19/02/2022 (normale analytique v2.6) : ~ 40ms/chunk
            break;
        case TaskType.Collision:
            const data = e.data as CollisionData;

            if (data.planetName != currentPlanetID) {
                currentPlanetID = data.planetName;
                terrainFunction = makeTerrainFunction(data.terrainSettings);
            }

            const samplePosition = new LVector3(data.position[0], data.position[1], data.position[2]);
            samplePosition.setMagnitudeInPlace(data.planetDiameter / 2);

            sendHeightAtPoint(samplePosition, data.seed);
            break;

        default:
            if (e.data.taskType) console.error(`Type de tâche reçue invalide : ${e.data.taskType}`);
            else console.log("Shared memory received");
    }
};
