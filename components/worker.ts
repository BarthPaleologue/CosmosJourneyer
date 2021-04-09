//import { workerInstruction } from "./workerInstruction.js";
//import { ProceduralEngine } from "../engine/proceduralEngine.js";

//importScripts("../engine/proceduralEngine.js");

importScripts("..//babylon/babylon4.js");

/*onmessage = e => {
    let data = (e.data);

    let vertices = [];
    let faces: number[][] = [];
    let subs = data.nbSubdivisions;
    let nbSubdivisions = subs + 1;

    for (let x = 0; x < nbSubdivisions; x++) {
        for (let y = 0; y < nbSubdivisions; y++) {
            let vertex = [(x - subs / 2) / subs, (y - subs / 2) / subs, 0];
            vertices.push(vertex);
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

    let size = data.baseLength / (2 ** data.depth);
    let positions = [];
    let indices = [];
    let normals: number[] = [];
    let uvs: number[] = [];
    let face_uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];

    // positions
    for (let vertex of vertices) {
        positions.push(vertex[0] * size, vertex[1] * size, vertex[2] * size);
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
    //BABYLON.VertexData._ComputeSides(BABYLON.Mesh.FRONTSIDE, positions, indices, normals, uvs);

    let vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;

    //@ts-ignore
    postMessage(vertexData);
};*/

onmessage = e => {
    let normals: number[] = [];
    BABYLON.VertexData.ComputeNormals(e.data.positions, e.data.indices, normals);
    //@ts-ignore
    postMessage(normals);
};