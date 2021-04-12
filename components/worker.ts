//import { Direction } from "./direction";

importScripts("../babylon/babylon4.js", "../babylon/jsonfn.js");

enum Direction {
    Up,
    Down,
    Left,
    Right,
    Forward,
    Backward
}

interface workerData {
    baseLength: number,
    depth: number,
    subdivisions: number,
    offset: BABYLON.Vector3,
    direction: Direction,
    terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3,
}

function createSphereChunk2(radius: number, size: number, subs: number, offset: BABYLON.Vector3, direction: Direction, terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3): BABYLON.VertexData {
    let vertices = [];
    let faces: number[][] = [];
    let nbSubdivisions = subs + 1;

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

    let positionVector = BABYLON.Vector3.Zero();
    positionVector = positionVector.add(offset);
    positionVector = BABYLON.Vector3.TransformCoordinates(positionVector, rotation);
    positionVector = positionVector.normalizeToNew().scale(radius);


    for (let x = 0; x < nbSubdivisions; x++) {
        for (let y = 0; y < nbSubdivisions; y++) {
            let vertex = new BABYLON.Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
            vertex = vertex.scale(size);
            vertex = vertex.add(offset);
            vertex = BABYLON.Vector3.TransformCoordinates(vertex, rotation);
            vertex = vertex.normalizeToNew().scale(radius);

            vertex = terrainFunction(vertex);

            vertices.push([vertex.x, vertex.y, vertex.z]);
            if (x < nbSubdivisions - 1 && y < nbSubdivisions - 1) {
                faces.push([
                    x * nbSubdivisions + y,
                    x * nbSubdivisions + y + 1,
                    (x + 1) * nbSubdivisions + y + 1,
                    (x + 1) * nbSubdivisions + y,
                ]);
            }
        }
    }

    /*for (let x = 0; x < nbSubdivisions - 1; x++) {
        for (let y = 0; y < nbSubdivisions - 1; y++) {*/
    /*faces.push([
        x * nbSubdivisions + y,
        x * nbSubdivisions + y + 1,
        (x + 1) * nbSubdivisions + y,
    ]);*/
    /*faces.push([
        (x + 1) * nbSubdivisions + y,
        x * nbSubdivisions + y + 1,
        (x + 1) * nbSubdivisions + y + 1
    ]);*/
    /*faces.push([
        x * nbSubdivisions + y,
        x * nbSubdivisions + y + 1,
        (x + 1) * nbSubdivisions + y + 1,
        (x + 1) * nbSubdivisions + y,
    ]);
}
}*/

    let positions: number[] = [];
    let indices: number[] = [];
    let normals: number[] = [];
    let uvs: number[] = [];
    let face_uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];

    // positions
    for (let vertex of vertices) {
        positions.push(vertex[0], vertex[1], vertex[2]);
    }

    // indices from faces
    let k = 0;
    for (let face of faces) {
        k++;
        for (let j = 0; j < face.length; j++) {
            uvs = uvs.concat(face_uvs[j]);
            //uvs = uvs.concat([k / faces.length, j / faces.length]);
        }
        for (let i = 0; i < face.length - 2; i++) {
            indices.push(face[0], face[i + 2], face[i + 1]);
        }
    }

    BABYLON.VertexData.ComputeNormals(positions, indices, normals);

    BABYLON.VertexData._ComputeSides(BABYLON.Mesh.FRONTSIDE, positions, indices, normals, uvs);

    let vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;


    return vertexData;
}

onmessage = e => {
    let d: workerData = JSON.parse(e.data);
    //@ts-ignore
    let terrainFunction = parse(d.terrainFunction);

    console.log(terrainFunction);
    let vertexData = createSphereChunk2(d.baseLength, d.baseLength / (2 ** d.depth), d.subdivisions, d.offset, d.direction, terrainFunction);
    //@ts-ignore
    postMessage(vertexData);
};