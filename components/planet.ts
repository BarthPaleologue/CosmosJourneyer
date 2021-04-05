import { NoiseEngine } from "../engine/perlin.js";
import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { proceduralMesh } from "../engine/proceduralMesh.js";
import { Crater } from "./crater.js";

export class Planet extends proceduralMesh {
    radius: number;
    subdivisions: number;
    updatable: boolean;

    craters: Crater[] = [];
    nbCraters = 200;
    craterRadiusFactor = 1;

    noiseEngine: NoiseEngine;
    noiseStrength = .1;
    noiseFrequency = .3;
    noiseOffsetX = 0;
    noiseOffsetY = 0;

    constructor(_id: string, _size: number, _subdivisions: number, _position: BABYLON.Vector3, _updatable: boolean, _scene: BABYLON.Scene) {
        super(_id, _position, _scene);

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

    generateCraters(n = this.nbCraters) {
        this.applyCraterData(-1);
        this.craters = [];
        this.nbCraters = 0;
        this.addCraters(n);
    }

    addCraters(n: number) {
        this.nbCraters += n;
        for (let i = 0; i < n; i++) {
            let faceId = Math.floor(Math.random() * 6);
            let r = this.craterRadiusFactor * (Math.random() ** 10) * this.subdivisions / 8;
            let x = Math.random() * (this.subdivisions - 2 * r) + r;
            let y = Math.random() * (this.subdivisions - 2 * r) + r;
            let maxDepth = 0.2 + (Math.random()) / 10;
            let steepness = 0.5 + (Math.random() - 0.5) / 10;
            this.craters.push({ faceId: faceId, radius: r, x: x, y: y, maxDepth: maxDepth, steepness: steepness });
        }
        this.applyCraterData();
    }

    applyCraterData(scaleFactor = 1) {
        this.morphBySides((faceId: number, x: number, y: number, position: BABYLON.Vector3) => {
            let newPosition = position;
            for (let crater of this.craters) {
                if (crater.faceId == faceId) {
                    let squaredDistanceToCrater = (x - crater.x) ** 2 + (y - crater.y) ** 2;

                    if (squaredDistanceToCrater <= crater.radius ** 2) {
                        let height = Math.min((squaredDistanceToCrater / (crater.radius ** 2)) * crater.steepness - 0.4, 0.5);
                        height = Math.max(height, -crater.maxDepth) * scaleFactor;
                        newPosition = position.add(position.normalizeToNew().scale(height));
                    }
                }
            }
            return newPosition;
        });
    }

    applyTerrain(noiseStrength = this.noiseStrength, noiseFrequency = this.noiseFrequency, noiseOffsetX = this.noiseOffsetX, noiseOffsetY = this.noiseOffsetY) {
        this.noiseStrength = noiseStrength;
        this.noiseFrequency = noiseFrequency;
        this.noiseOffsetX = noiseOffsetX;
        this.noiseOffsetY = noiseOffsetY;
        this.morphBySides((faceId: number, x: number, y: number, position: BABYLON.Vector3) => {
            if (x > 1 && x < this.subdivisions - 1 && y > 1 && y < this.subdivisions - 1) {
                return position.add(position.normalizeToNew().scale(noiseStrength * this.noiseEngine.simplex2((x + noiseOffsetX) * noiseFrequency, (y + noiseOffsetY) * noiseFrequency)));
            } else return position;
        });
    }

    removeNoise() {
        this.morphBySides((faceId: number, x: number, y: number, position: BABYLON.Vector3) => {
            if (x > 1 && x < this.subdivisions - 1 && y > 1 && y < this.subdivisions - 1) {
                return position.add(position.normalizeToNew().scale(-this.noiseStrength * this.noiseEngine.simplex2((x + this.noiseOffsetX) * this.noiseFrequency, (y + this.noiseOffsetY) * this.noiseFrequency)));
            } else return position;
        });
    }

    regenerate(n = this.nbCraters, noiseStrength = this.noiseStrength, noiseFrequency = this.noiseFrequency, noiseOffsetX = this.noiseOffsetX, noiseOffsetY = this.noiseOffsetY) {
        this.removeNoise();
        this.applyTerrain(noiseStrength, noiseFrequency, noiseOffsetX, noiseOffsetY);
        this.generateCraters(n);
    }

    regenerateTerrain(noiseStrength = this.noiseStrength, noiseFrequency = this.noiseFrequency, noiseOffsetX = this.noiseOffsetX, noiseOffsetY = this.noiseOffsetY) {
        this.removeNoise();
        this.applyTerrain(noiseStrength, noiseFrequency, noiseOffsetX, noiseOffsetY);
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