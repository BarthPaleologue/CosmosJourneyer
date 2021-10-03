import { Direction } from "../components/toolbox/direction.js";

export class ProceduralEngine {

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
    ]);*/

    /**
     * Create sphere chunk 
     * @param radius // radius of said sphere
     * @param size  // size of returned chunk (idealy 2*radius)
     * @param subs // nb subdivisions
     * @param offset // offset of the plane
     * @param direction // direction of the plane
     * @param scene // scene to attach everything to
     * @param terrainFunction // how to morph the terrain
     * @param parentPosition // position in world space
     * @returns Planet chunk
     */
    static createSphereChunk(radius: number, size: number, subs: number, offset: BABYLON.Vector3, direction: Direction, scene: BABYLON.Scene, terrainFunction: (p: BABYLON.Vector3) => BABYLON.Vector3): BABYLON.Mesh {
        let vertices: number[] = [];
        let faces: number[][] = [];
        let uvs: number[] = [];
        let verticesPerLine = subs + 1;

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

        for (let x = 0; x < verticesPerLine; x++) {
            for (let y = 0; y < verticesPerLine; y++) {
                let vertex = new BABYLON.Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
                vertex = vertex.scale(size);
                vertex = vertex.add(offset);
                vertex = BABYLON.Vector3.TransformCoordinates(vertex, rotation);
                vertex = vertex.normalizeToNew().scale(radius);

                vertex = terrainFunction(vertex);

                vertices.push(vertex.x, vertex.y, vertex.z);
                uvs.push(x / subs, y / subs);
                if (x < subs && y < subs) {
                    faces.push([
                        x * verticesPerLine + y,
                        x * verticesPerLine + y + 1,
                        (x + 1) * verticesPerLine + y + 1,
                        (x + 1) * verticesPerLine + y,
                    ]);
                }
            }
        }

        return this.createPolyhedron(vertices, faces, uvs, scene);
    }

    static createPlanetSideLegacy(radius: number, subs: number, direction: Direction, scene: BABYLON.Scene) {
        return this.createSphereChunk(radius, radius * 2, subs, new BABYLON.Vector3(0, 0, radius), direction, scene, (p: BABYLON.Vector3) => p);
    }

    /**
     * Creates planet with single chunks as faces (you won't be able to do lod with it)
     * @param radius radius of the planet
     * @param subdivisions subdivisions of the faces 
     * @param scene the babylon scene to attach it to
     * @returns The combined meshes of the 6 faces (merged)
     */
    static createPlanet(radius: number, subdivisions: number, scene: BABYLON.Scene) {

        let sides: BABYLON.Mesh[] = [
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Up, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Down, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Right, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Left, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Forward, scene),
            this.createPlanetSideLegacy(radius, subdivisions, Direction.Backward, scene),
        ];

        return BABYLON.Mesh.MergeMeshes(sides)!;
    }

    /**
     * Creates a procedural plane in its simplest faschion
     * @param size size of the plane
     * @param subs number of subdivisions of the plane
     * @param scene scene to attach the result mesh to
     * @returns the procedural mesh
     */
    static createPlaneLegacy(size: number, subs: number, scene: BABYLON.Scene): BABYLON.Mesh {
        let vertices = [];
        let faces: number[][] = [];
        let uvs: number[] = [];
        let vertexPerLine = subs + 1;

        for (let x = 0; x < vertexPerLine; x++) {
            for (let y = 0; y < vertexPerLine; y++) {
                let vertex = new BABYLON.Vector3((x - subs / 2) / subs, (y - subs / 2) / subs, 0);
                vertices.push(vertex.x, vertex.y, vertex.z);
                uvs.push(x / subs, y / subs);
                if (x < subs && y < subs - 1) {
                    faces.push([
                        x * subs + y,
                        x * subs + y + 1,
                        (x + 1) * subs + y + 1,
                        (x + 1) * subs + y,
                    ]);
                }
            }
        }

        return this.createPolyhedron(vertices, faces, uvs, scene);
    }

    /**
     * Creates a procedural cube
     * @param size size of the cube
     * @param subdivisions number of subdivisions of each side
     * @param scene the scene to attach the cube to
     * @returns the cube as a BABYLON.Mesh
     */
    static createCube(size: number, subdivisions: number, scene: BABYLON.Scene): BABYLON.Mesh {

        let sides: BABYLON.Mesh[] = [];

        for (let i = 0; i < 6; i++) {
            let plane = ProceduralEngine.createPlaneLegacy(size, subdivisions, scene);
            sides.push(plane);
        }

        sides[0].rotation.y = Math.PI;
        sides[0].position.z = size / 2;

        sides[1].position.z = - size / 2;

        sides[2].rotation.x = Math.PI / 2;
        sides[2].position.y = size / 2;

        sides[3].rotation.x = -Math.PI / 2;
        sides[3].position.y = -size / 2;

        sides[4].rotation.y = -Math.PI / 2;
        sides[4].position.x = size / 2;

        sides[5].rotation.y = Math.PI / 2;
        sides[5].position.x = - size / 2;

        return BABYLON.Mesh.MergeMeshes(sides)!;
    }

    /**
     * Creates mesh from vertices, faces and uvs : it generates normals (ressource intensive) then the mesh
     * @param vertices positions of the vertices
     * @param faces triangles
     * @param _uvs uv data
     * @param scene the scene to attach the mesh to
     * @returns the resulting mesh
     */
    static createPolyhedron(vertices: number[], faces: number[][], _uvs: number[], scene: BABYLON.Scene) {
        let positions: number[] = vertices;
        let indices: number[] = [];
        let normals: number[] = [];
        let uvs: number[] = _uvs;
        let face_uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];

        // indices from faces
        for (let face of faces) {
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

        vertexData.applyToMesh(polygon);

        return polygon;
    }
}