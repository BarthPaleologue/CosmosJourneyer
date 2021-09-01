//https://github.com/BabylonJS/Babylon.js/blob/master/src/Meshes/mesh.vertexData.ts
export function ComputeNormals(positions, indices, normals) {
    // temporary scalar variables
    var index = 0; // facet index
    var p1p2x = 0.0; // p1p2 vector x coordinate
    var p1p2y = 0.0; // p1p2 vector y coordinate
    var p1p2z = 0.0; // p1p2 vector z coordinate
    var p3p2x = 0.0; // p3p2 vector x coordinate
    var p3p2y = 0.0; // p3p2 vector y coordinate
    var p3p2z = 0.0; // p3p2 vector z coordinate
    var faceNormalx = 0.0; // facet normal x coordinate
    var faceNormaly = 0.0; // facet normal y coordinate
    var faceNormalz = 0.0; // facet normal z coordinate
    var length = 0.0; // facet normal length before normalization
    var v1x = 0; // vector1 x index in the positions array
    var v1y = 0; // vector1 y index in the positions array
    var v1z = 0; // vector1 z index in the positions array
    var v2x = 0; // vector2 x index in the positions array
    var v2y = 0; // vector2 y index in the positions array
    var v2z = 0; // vector2 z index in the positions array
    var v3x = 0; // vector3 x index in the positions array
    var v3y = 0; // vector3 y index in the positions array
    var v3z = 0; // vector3 z index in the positions array
    var faceNormalSign = 1;
    // reset the normals
    for (index = 0; index < positions.length; index++) {
        normals[index] = 0.0;
    }
    // Loop : 1 indice triplet = 1 facet
    var nbFaces = (indices.length / 3) | 0;
    for (index = 0; index < nbFaces; index++) {
        // get the indexes of the coordinates of each vertex of the facet
        v1x = indices[index * 3] * 3;
        v1y = v1x + 1;
        v1z = v1x + 2;
        v2x = indices[index * 3 + 1] * 3;
        v2y = v2x + 1;
        v2z = v2x + 2;
        v3x = indices[index * 3 + 2] * 3;
        v3y = v3x + 1;
        v3z = v3x + 2;
        p1p2x = positions[v1x] - positions[v2x]; // compute two vectors per facet : p1p2 and p3p2
        p1p2y = positions[v1y] - positions[v2y];
        p1p2z = positions[v1z] - positions[v2z];
        p3p2x = positions[v3x] - positions[v2x];
        p3p2y = positions[v3y] - positions[v2y];
        p3p2z = positions[v3z] - positions[v2z];
        // compute the face normal with the cross product
        faceNormalx = faceNormalSign * (p1p2y * p3p2z - p1p2z * p3p2y);
        faceNormaly = faceNormalSign * (p1p2z * p3p2x - p1p2x * p3p2z);
        faceNormalz = faceNormalSign * (p1p2x * p3p2y - p1p2y * p3p2x);
        // normalize this normal and store it in the array facetData
        length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
        length = (length === 0) ? 1.0 : length;
        faceNormalx /= length;
        faceNormaly /= length;
        faceNormalz /= length;
        // compute the normals anyway
        normals[v1x] += faceNormalx; // accumulate all the normals per face
        normals[v1y] += faceNormaly;
        normals[v1z] += faceNormalz;
        normals[v2x] += faceNormalx;
        normals[v2y] += faceNormaly;
        normals[v2z] += faceNormalz;
        normals[v3x] += faceNormalx;
        normals[v3y] += faceNormaly;
        normals[v3z] += faceNormalz;
    }
    // last normalization of each normal
    for (index = 0; index < normals.length / 3; index++) {
        faceNormalx = normals[index * 3];
        faceNormaly = normals[index * 3 + 1];
        faceNormalz = normals[index * 3 + 2];
        length = Math.sqrt(faceNormalx * faceNormalx + faceNormaly * faceNormaly + faceNormalz * faceNormalz);
        length = (length === 0) ? 1.0 : length;
        faceNormalx /= length;
        faceNormaly /= length;
        faceNormalz /= length;
        normals[index * 3] = faceNormalx;
        normals[index * 3 + 1] = faceNormaly;
        normals[index * 3 + 2] = faceNormalz;
    }
}
