export class proceduralMesh {
    id: string;
    position: BABYLON.Vector3;
    material: BABYLON.StandardMaterial;
    mesh: BABYLON.Mesh;
    scene: BABYLON.Scene;
    constructor(_id: string, _position: BABYLON.Vector3, _scene: BABYLON.Scene) {
        this.id = _id;
        this.position = _position;
        this.scene = _scene;
        this.mesh = new BABYLON.Mesh(`${this.id}Placeholder`, this.scene);
        this.material = new BABYLON.StandardMaterial(`${this.id}Material`, this.scene);
        this.material.pointsCloud = false;
        this.material.pointSize = 2;
        this.material.wireframe = false;
        this.mesh.material = this.material;
    }

    normalize(magnitude: number) {
        this.morph((i: number, position: BABYLON.Vector3) => {
            return position.normalize().scaleInPlace(magnitude);
        });
    }

    morphToWiggles(freq: number, amp: number) {
        this.morph((i: number, position: BABYLON.Vector3) => {
            return position.scale(1 + amp * Math.sin(freq * position.y));
        });
    }

    morph(morphFunction: Function) {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)!;
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)!;

        for(let i = 0; i < vertices.length; i += 3) {
            let position = new BABYLON.Vector3(vertices[i], vertices[i+1], vertices[i+2]);

            position = morphFunction(i/3, position);
            
            vertices[i] = position.x;
            vertices[i + 1] = position.y;
            vertices[i + 2] = position.z;
        }

        BABYLON.VertexData.ComputeNormals(vertices, indices, normals);

        let vertexData = new BABYLON.VertexData()
        vertexData.positions = vertices;
        vertexData.normals = normals;
        vertexData.indices = indices;

        vertexData.applyToMesh(this.mesh, true);
    }

    toggleWireframe() {
        this.material!.wireframe = !this.material?.wireframe;
    }

    togglePointsCloud() {
        this.material!.pointsCloud = !this.material?.pointsCloud;
    }
}