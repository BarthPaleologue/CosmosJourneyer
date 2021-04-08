export class ProceduralEngine {
    static createPlane(size: number, subs: number, position: BABYLON.Vector3, scene: BABYLON.Scene) {
        let vertices = [];
        let faces: number[][] = [];
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

        return this.createPolyhedron(vertices, faces, size, position, scene);
    }

    static createCorneredPlane(size: number, subs: number, position: BABYLON.Vector3, scene: BABYLON.Scene) {
        let vertices = [];
        let faces: number[][] = [];
        let nbSubdivisions = subs + 1;

        for (let x = 0; x < nbSubdivisions; x++) {
            for (let y = 0; y < nbSubdivisions; y++) {
                let vertex = [x / subs, y / subs, 0];
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

        return this.createPolyhedron(vertices, faces, size, position, scene);
    }

    static createCube(size: number, subdivisions: number, scene: BABYLON.Scene) {

        let sides: BABYLON.Mesh[] = [];

        for (let i = 0; i < 6; i++) {
            let plane = ProceduralEngine.createPlane(size, subdivisions, BABYLON.Vector3.Zero(), scene);
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

    static createPolyhedron(vertices: Array<Array<number>>, faces: Array<Array<number>>, size: number, position: BABYLON.Vector3, scene: BABYLON.Scene) {
        let positions = [];
        let indices = [];
        let normals: number[] = [];
        let uvs: number[] = [];
        let face_uvs = [[0, 0], [1, 0], [1, 1], [0, 1]];
        //let colors: number[] = [];

        // positions
        for (let vertex of vertices) {
            positions.push(vertex[0] * size + position.x, vertex[1] * size + position.y, vertex[2] * size + position.z);
            //let color = new BABYLON.Color4(Math.random(), Math.random(), Math.random(), 1);
            //colors.push(color.r, color.g, color.b, color.a);
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
        //vertexData.colors = colors;

        let polygon = new BABYLON.Mesh("mesh", scene);
        vertexData.applyToMesh(polygon, true);

        return polygon;
    }
}

/*export function generateProceduralPlane(size: number, subs: number) {
    let vertices = [];
    let faces = [];
    let nbSubdivisions = subs + 1;

    for (let x = 0; x < nbSubdivisions; x++) {
        for(let y = 0; y < nbSubdivisions; y++) {
            let vertex = [(x - subs/2) * size / subs, (y-subs/2) * size / subs, 0];
            vertices.push(vertex);
        }
    }

    for(let x = 0; x < nbSubdivisions - 1; x++) {
        for(let y = 0; y < nbSubdivisions - 1 ; y++) {
            faces.push([
                x * nbSubdivisions + y,
                x * nbSubdivisions + y + 1,
                (x+1) * nbSubdivisions + y,
            ]);
            faces.push([
                (x+1) * nbSubdivisions + y,
                x * nbSubdivisions + y + 1,
                (x+1) * nbSubdivisions + y + 1
            ]);
        }
    }

    return [vertices, faces];
}*/

/*export function createPolyhedron(vertices: Array<Array<number>>, faces: Array<Array<number>>, size:number, scene:BABYLON.Scene) {
    let positions = [];
    let indices = [];
    let normals: number[] = [];
    let uvs: number[] = [];
    let face_uvs = [[0,0],[1,0],[1,1],[0,1]];

    // positions
    for (let vertex of vertices) {
        positions.push(vertex[0] * size, vertex[1] * size, vertex[2] * size);
    }

    // indices from faces
    let k = 0;
    for (let face of faces) {
        k++;
        for(let j = 0; j < face.length; j++) {
            //uvs = uvs.concat(face_uvs[j]);
            uvs = uvs.concat([k / faces.length, j / faces.length]);
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
}*/