import { Direction } from "../components/direction.js";
let worker = new Worker("../components/worker.js");
export class ProceduralEngine {
    static createSphereChunk2(radius, size, subs, offset, direction, terrainFunction) {
        let vertices = [];
        let faces = [];
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
        let positions = [];
        let indices = [];
        let normals = [];
        let uvs = [];
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
    static createSphereChunk(radius, size, subs, position, offset, direction, scene, terrainFunction, parentPosition = BABYLON.Vector3.Zero()) {
        let vertices = [];
        let faces = [];
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
        positionVector = positionVector.add(parentPosition);
        for (let x = 0; x < nbSubdivisions; x++) {
            for (let y = 0; y < nbSubdivisions; y++) {
                let vertex = new BABYLON.Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
                vertex = vertex.scale(size);
                vertex = vertex.add(offset);
                vertex = BABYLON.Vector3.TransformCoordinates(vertex, rotation);
                vertex = vertex.normalizeToNew().scale(radius);
                vertex = terrainFunction(vertex);
                vertex = vertex.add(parentPosition);
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
        return [this.createPolyhedron(vertices, faces, 1, BABYLON.Vector3.Zero(), scene), positionVector];
    }
    static createPlanetSideLegacy(radius, subs, direction, scene) {
        return this.createSphereChunk(radius, radius * 2, subs, BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, -radius), direction, scene, (p) => p)[0];
    }
    static createPlanet(radius, subdivisions, scene) {
        let sides = [
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Up, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Down, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Right, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Left, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Forward, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Backward, scene),
        ];
        return BABYLON.Mesh.MergeMeshes(sides);
    }
    static createPlaneLegacy(size, subs, scene) {
        let vertices = [];
        let faces = [];
        let nbSubdivisions = subs + 1;
        for (let x = 0; x < nbSubdivisions; x++) {
            for (let y = 0; y < nbSubdivisions; y++) {
                let vertex = new BABYLON.Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
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
        return this.createPolyhedron(vertices, faces, size, BABYLON.Vector3.Zero(), scene);
    }
    static createCube(size, subdivisions, scene) {
        let sides = [];
        for (let i = 0; i < 6; i++) {
            let plane = ProceduralEngine.createPlaneLegacy(size, subdivisions, scene);
            sides.push(plane);
        }
        sides[0].rotation.y = Math.PI;
        sides[0].position.z = size / 2;
        sides[1].position.z = -size / 2;
        sides[2].rotation.x = Math.PI / 2;
        sides[2].position.y = size / 2;
        sides[3].rotation.x = -Math.PI / 2;
        sides[3].position.y = -size / 2;
        sides[4].rotation.y = -Math.PI / 2;
        sides[4].position.x = size / 2;
        sides[5].rotation.y = Math.PI / 2;
        sides[5].position.x = -size / 2;
        return BABYLON.Mesh.MergeMeshes(sides);
    }
    static createPolyhedron(vertices, faces, size, position, scene) {
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
        let polygon = new BABYLON.Mesh("mesh", scene);
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        BABYLON.VertexData._ComputeSides(BABYLON.Mesh.FRONTSIDE, positions, indices, normals, uvs);
        let vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.uvs = uvs;
        vertexData.applyToMesh(polygon, false);
        polygon.position = position;
        return polygon;
    }
}
