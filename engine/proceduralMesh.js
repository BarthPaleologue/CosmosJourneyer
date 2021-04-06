export class proceduralMesh {
    constructor(_id, _position, _scene) {
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
    normalize(magnitude) {
        this.morph((i, position) => {
            return position.normalize().scaleInPlace(magnitude);
        });
    }
    morphToWiggles(freq, amp) {
        this.morph((i, position) => {
            return position.scale(1 + amp * Math.sin(freq * position.y));
        });
    }
    morph(morphFunction) {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        for (let i = 0; i < vertices.length; i += 3) {
            let position = new BABYLON.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
            position = morphFunction(i / 3, position);
            vertices[i] = position.x;
            vertices[i + 1] = position.y;
            vertices[i + 2] = position.z;
        }
        BABYLON.VertexData.ComputeNormals(vertices, indices, normals);
        let vertexData = new BABYLON.VertexData();
        vertexData.positions = vertices;
        vertexData.normals = normals;
        vertexData.indices = indices;
        vertexData.applyToMesh(this.mesh, true);
    }
    color(colorFunction) {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        let colors = this.mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
        let newColors = [];
        for (let i = 0; i < vertices.length; i += 3) {
            let position = new BABYLON.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]);
            let color = colorFunction(i / 3, position);
            newColors.push(color.r, color.g, color.b, color.a);
        }
        let vertexData = new BABYLON.VertexData();
        vertexData.positions = vertices;
        vertexData.normals = normals;
        vertexData.indices = indices;
        vertexData.colors = newColors;
        vertexData.applyToMesh(this.mesh, true);
    }
    toggleWireframe() {
        var _a;
        this.material.wireframe = !((_a = this.material) === null || _a === void 0 ? void 0 : _a.wireframe);
    }
    togglePointsCloud() {
        var _a;
        this.material.pointsCloud = !((_a = this.material) === null || _a === void 0 ? void 0 : _a.pointsCloud);
    }
}
