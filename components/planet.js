import { NoiseEngine } from "../engine/perlin.js";
import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { proceduralMesh } from "../engine/proceduralMesh.js";
export class Planet extends proceduralMesh {
    constructor(_id, _size, _subdivisions, _position, _scene) {
        super(_id, _position, _scene);
        this.radius = _size / 2;
        this.subdivisions = _subdivisions;
        this.mesh = ProceduralEngine.createCube(_size, this.subdivisions, this.scene);
        this.mesh.position = this.position;
        this.mesh.material = this.material;
        this.normalize(this.radius);
        this.noiseEngine = new NoiseEngine();
        this.applyTerrain();
        this.craters = [];
        this.generateCraters(50);
    }
    generateCraters(n) {
        this.craters = [];
        this.addCraters(n);
    }
    addCraters(n) {
        for (let i = 0; i < n; i++) {
            let faceId = Math.floor(Math.random() * 6);
            let r = Math.random() * this.subdivisions / 8;
            let x = Math.random() * (this.subdivisions - 4 * r) + 2 * r;
            let y = Math.random() * (this.subdivisions - 4 * r) + 2 * r;
            this.craters.push({ faceId: faceId, radius: r, x: x, y: y });
        }
        this.applyCraterData();
    }
    applyCraterData() {
        this.morphBySides((faceId, x, y, position) => {
            let newPosition = position;
            for (let crater of this.craters) {
                if (crater.faceId == faceId) {
                    let squaredDistanceToCrater = Math.pow((x - crater.x), 2) + Math.pow((y - crater.y), 2);
                    if (squaredDistanceToCrater <= Math.pow(crater.radius, 2)) {
                        newPosition = newPosition.scale(0.95 + Math.pow((squaredDistanceToCrater / 100), 2));
                    }
                }
            }
            return newPosition;
        });
    }
    applyTerrain() {
        this.noiseEngine.seed(0.42);
        this.morphBySides((faceId, x, y, position) => {
            if (x > 1 && x < this.subdivisions && y > 1 && y < this.subdivisions) {
                return position.scale(1 + 0.01 * this.noiseEngine.simplex2(x, y));
            }
            else
                return position;
        });
    }
    morphBySides(morphFunction) {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        for (let faceId = 0; faceId < 6; faceId++) {
            let faceStart = faceId * vertices.length / 6; // index du premier inclus
            // le +1 viens du fait que y a pour n+1 vertices pour n carrés de subdivisions
            for (let x = 0; x < this.subdivisions + 1; x++) {
                for (let y = 0; y < this.subdivisions + 1; y++) {
                    let indexOffset = faceStart + 3 * (x * (this.subdivisions + 1) + y); // on commence au début de la face, et on ajoute le triple de case visitées (tableau déplié)
                    let position = new BABYLON.Vector3(vertices[indexOffset], vertices[indexOffset + 1], vertices[indexOffset + 2]);
                    position = morphFunction(faceId, x, y, position);
                    vertices[indexOffset] = position.x;
                    vertices[indexOffset + 1] = position.y;
                    vertices[indexOffset + 2] = position.z;
                }
            }
        }
        BABYLON.VertexData.ComputeNormals(vertices, indices, normals);
        let vertexData = new BABYLON.VertexData();
        vertexData.positions = vertices;
        vertexData.normals = normals;
        vertexData.indices = indices;
        vertexData.applyToMesh(this.mesh, true);
    }
}
