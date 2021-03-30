import { NoiseEngine } from "../engine/perlin.js";
import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { proceduralMesh } from "../engine/proceduralMesh.js";
export class Planet extends proceduralMesh {
    constructor(_id, _size, _subdivisions, _position, _updatable, _scene) {
        super(_id, _position, _scene);
        this.craters = [];
        this.nbCraters = 200;
        this.craterRadiusFactor = 1;
        this.noiseOffsetX = 0;
        this.noiseOffsetY = 0;
        this.radius = _size / 2;
        this.subdivisions = _subdivisions;
        this.updatable = _updatable;
        this.mesh = ProceduralEngine.createCube(_size, this.subdivisions, this.scene);
        this.mesh.position = this.position;
        this.mesh.material = this.material;
        //this.material.roughness = 10;
        this.material.specularColor = new BABYLON.Color3(.05, .05, .05);
        this.material.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.08);
        this.normalize(this.radius);
        this.noiseEngine = new NoiseEngine();
        this.noiseEngine.seed(0);
        this.applyTerrain();
        this.generateCraters(this.nbCraters);
        //this.applyTerrain();
        if (!this.updatable) {
            this.mesh.forceSharedVertices();
            this.mesh.simplify([
                { quality: 0.9, distance: 60, optimizeMesh: true },
                { quality: 0.8, distance: 80, optimizeMesh: true },
                { quality: 0.7, distance: 100, optimizeMesh: true },
                { quality: 0.6, distance: 120, optimizeMesh: true },
                { quality: 0.5, distance: 140, optimizeMesh: true },
                { quality: 0.3, distance: 180, optimizeMesh: true },
                { quality: 0.1, distance: 220, optimizeMesh: true },
            ], true, BABYLON.SimplificationType.QUADRATIC);
        }
        //this.mesh.checkCollisions = true;
        //this.material.diffuseTexture = new BABYLON.Texture("../trump.jpg", this.scene);
    }
    generateCraters(n) {
        this.craters = [];
        this.nbCraters = 0;
        this.addCraters(n);
    }
    addCraters(n) {
        this.nbCraters += n;
        for (let i = 0; i < n; i++) {
            let faceId = Math.floor(Math.random() * 6);
            let r = this.craterRadiusFactor * (Math.pow(Math.random(), 2)) * this.subdivisions / 8;
            let x = Math.random() * (this.subdivisions - 2 * r) + r;
            let y = Math.random() * (this.subdivisions - 2 * r) + r;
            let maxDepth = 0.96 + (Math.random() - 0.5) / 10;
            let steepness = 0.5 + (Math.random() - 0.5) / 10;
            this.craters.push({ faceId: faceId, radius: r, x: x, y: y, maxDepth: maxDepth, steepness: steepness });
        }
        this.applyCraterData();
    }
    applyCraterData() {
        this.morphBySides((faceId, x, y, position) => {
            let newPosition = position;
            for (let crater of this.craters) {
                if (crater.faceId == faceId) {
                    let squaredDistanceToCrater = Math.pow((x - crater.x), 2) + Math.pow((y - crater.y), 2);
                    if (squaredDistanceToCrater <= Math.pow(crater.radius, 2) && position.lengthSquared() > 0.95 * Math.pow(this.radius, 2)) {
                        let height = Math.min((squaredDistanceToCrater / (Math.pow(crater.radius, 2))) * crater.steepness + 0.6, 1.02);
                        height = Math.max(height, crater.maxDepth);
                        newPosition = newPosition.scale(height);
                    }
                }
            }
            return newPosition;
        });
    }
    applyTerrain() {
        this.morphBySides((faceId, x, y, position) => {
            if (x > 1 && x < this.subdivisions - 1 && y > 1 && y < this.subdivisions - 1) {
                return position.scale(0.999 + .007 * this.noiseEngine.simplex2((x + this.noiseOffsetX) / 3, (y + this.noiseOffsetY) / 3));
                //return position.scale(0.999 + .01 * this.noiseEngine.perlin3(position.x, position.y, position.z));
            }
            else
                return position;
        });
    }
    regenerate(n = this.nbCraters) {
        this.normalize(this.radius);
        this.applyTerrain();
        this.generateCraters(n);
    }
    regenerateTerrain() {
        this.normalize(this.radius);
        this.applyTerrain();
        this.applyCraterData();
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
