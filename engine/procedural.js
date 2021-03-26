export function generateProceduralPlane(size, subs) {
    let vertices = [];
    let faces = [];
    let nbSubdivisions = subs + 1;
    for (let x = 0; x < nbSubdivisions; x++) {
        for (let y = 0; y < nbSubdivisions; y++) {
            let vertex = [(x - subs / 2) * size / subs, (y - subs / 2) * size / subs, 0];
            //BABYLON.Vector3.Normalize(BABYLON.Vector3.FromArray(vertex)).scale(3).toArray(vertex)
            vertices.push(vertex);
            //let s = new BABYLON.Mesh.CreateSphere("s", 1, 0.1, scene);
            //s.position = new BABYLON.Vector3.FromArray(vertex);
        }
    }
    for (let x = 0; x < nbSubdivisions - 1; x++) {
        for (let y = 0; y < nbSubdivisions - 1; y++) {
            faces.push([
                x * nbSubdivisions + y,
                (x + 1) * nbSubdivisions + y,
                x * nbSubdivisions + y + 1
            ]);
            faces.push([
                (x + 1) * nbSubdivisions + y,
                x * nbSubdivisions + y + 1,
                (x + 1) * nbSubdivisions + y + 1
            ]);
        }
    }
    return [vertices, faces];
}
export function createPolyhedron(vertices, faces, size, scene) {
    let positions = [];
    let indices = [];
    let normals = [];
    let uvs = [];
    let face_uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
    // positions
    for (let vertex of vertices) {
        positions.push(vertex[0] * size, vertex[1] * size, vertex[2] * size);
    }
    // indices from faces		  
    for (let face of faces) {
        for (let j = 0; j < face.length; j++) {
            uvs = uvs.concat(face_uvs[j]);
        }
        for (let i = 0; i < face.length - 2; i++) {
            indices.push(face[0], face[i + 2], face[i + 1]);
        }
    }
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    //@ts-ignore
    BABYLON.VertexData._ComputeSides(BABYLON.Mesh.FRONTSIDE, positions, indices, normals, uvs);
    let vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    let polygon = new BABYLON.Mesh("mesh", scene);
    vertexData.applyToMesh(polygon, true);
    return polygon;
}
;
