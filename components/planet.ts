import { NoiseEngine } from "../engine/perlin.js";
import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { proceduralMesh } from "../engine/proceduralMesh.js";
import { Crater } from "./crater.js";

export class Planet extends proceduralMesh {
    radius: number;
    subdivisions: number;
    craters: Crater[];
    noiseEngine: NoiseEngine;

    constructor(_id: string, _size: number, _subdivisions: number, _position: BABYLON.Vector3, _scene: BABYLON.Scene) {
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
        this.generateCraters(200);

        //this.material.diffuseTexture = new BABYLON.Texture("../trump.jpg", this.scene);
    }

    generateCraters(n: number) {
        this.craters = [];
        this.addCraters(n);
    }

    addCraters(n: number) {
        for (let i = 0; i < n; i++) {
            let faceId = Math.floor(Math.random() * 6);
            let r = (Math.random() ** 2) * this.subdivisions / 8;
            let x = Math.random() * (this.subdivisions - 4 * r) + 2 * r;
            let y = Math.random() * (this.subdivisions - 4 * r) + 2 * r;
            this.craters.push({ faceId: faceId, radius: r, x: x, y: y });
        }
        this.applyCraterData();
    }

    applyCraterData() {
        this.morphBySides((faceId: number, x: number, y: number, position: BABYLON.Vector3) => {
            let newPosition = position;
            for (let crater of this.craters) {
                if (crater.faceId == faceId) {
                    let squaredDistanceToCrater = (x - crater.x) ** 2 + (y - crater.y) ** 2;

                    if (squaredDistanceToCrater <= crater.radius ** 2) {
                        let height = Math.min(0.96 + (squaredDistanceToCrater / 100) ** 3, 1.01);
                        newPosition = newPosition.scale(height);
                    }
                }
            }
            return newPosition;
        });
    }

    applyTerrain() {
        this.noiseEngine.seed(0.42);
        this.morphBySides((faceId: number, x: number, y: number, position: BABYLON.Vector3) => {
            if (x > 1 && x < this.subdivisions && y > 1 && y < this.subdivisions) {
                return position.scale(0.999 + .007 * this.noiseEngine.simplex2(x / 3, y / 3));
            } else return position;
        });
    }

    morphBySides(morphFunction: (faceId: number, x: number, y: number, position: BABYLON.Vector3) => BABYLON.Vector3) {
        let vertices = this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)!;
        let indices = this.mesh.getIndices();
        let normals = this.mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind)!;

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