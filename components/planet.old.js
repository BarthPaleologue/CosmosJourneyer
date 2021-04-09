import { NoiseEngine } from "../engine/perlin.js";
import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { proceduralMesh } from "../engine/proceduralMesh.js";
export class Planet extends proceduralMesh {
    constructor(_id, _size, _subdivisions, _position, _updatable, _scene) {
        super(_id, _position, _scene);
        this.craters = [];
        this.nbCraters = 200;
        this.craterRadiusFactor = 1;
        this.craterSteepnessFactor = 1;
        this.craterMaxDepthFactor = 1;
        this.noiseStrength = 1;
        this.noiseFrequency = .3;
        this.noiseOffsetX = 0;
        this.noiseOffsetY = 0;
        this.radius = _size / 2;
        this.subdivisions = _subdivisions;
        this.updatable = _updatable;
        this.mesh = ProceduralEngine.createCube(_size, this.subdivisions, this.scene);
        this.mesh.forceSharedVertices();
        this.mesh.position = this.position;
        this.mesh.material = this.material;
        //this.material.roughness = 10;
        this.material.specularColor = new BABYLON.Color3(.0, .0, .0);
        //this.material.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.08);
        this.normalize(this.radius);
        this.noiseEngine = new NoiseEngine();
        this.noiseEngine.seed(0);
        this.applyNoise();
        this.generateCraters(this.nbCraters);
        this.refreshColors();
        //this.mesh.updateFacetData();
        //this.mesh.increaseVertices(1);
        if (!this.updatable) {
            //this.mesh.forceSharedVertices();
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
    addCraters(n) {
        this.nbCraters += n;
        for (let i = 0; i < n; i++) {
            let r = this.craterRadiusFactor * (Math.pow(Math.random(), 10)) * 6;
            // random spherical coordinates
            let phi = Math.random() * Math.PI * 2;
            let theta = Math.random() * Math.PI;
            let position = new BABYLON.Vector3(Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi));
            let maxDepth = 0.2 + (Math.random()) / 10;
            let steepness = this.craterSteepnessFactor * (1 + (Math.random()) / 10);
            this.craters.push({ radius: r, position: position, maxDepth: maxDepth, steepness: steepness });
        }
        this.applyCraterData();
    }
    applyCraterData(scaleFactor = 1) {
        this.morph((i, position) => {
            let newPosition = position;
            let normalizedPosition = position.normalizeToNew();
            for (let crater of this.craters) {
                let squaredDistanceToCrater = BABYLON.Vector3.DistanceSquared(normalizedPosition, crater.position);
                let radius = crater.radius * this.craterRadiusFactor / (Math.pow(this.radius, 2));
                let steepness = crater.steepness * this.craterSteepnessFactor;
                if (squaredDistanceToCrater <= Math.pow(radius, 2)) {
                    let height = Math.min((squaredDistanceToCrater / (Math.pow(radius, (2)) * steepness)) - 0.4, 0.05);
                    height = Math.max(height, -crater.maxDepth * this.craterMaxDepthFactor) * scaleFactor;
                    newPosition = position.add(normalizedPosition.scale(height));
                }
            }
            return newPosition;
        });
        this.refreshColors();
    }
    refreshCraters(_radiusFactor = this.craterRadiusFactor, _steepnessFactor = this.craterSteepnessFactor, _depthFactor = this.craterMaxDepthFactor) {
        this.applyCraterData(-1);
        this.craterRadiusFactor = _radiusFactor;
        this.craterSteepnessFactor = _steepnessFactor;
        this.craterMaxDepthFactor = _depthFactor;
        this.applyCraterData();
    }
    applyNoise(noiseStrength = this.noiseStrength, noiseFrequency = this.noiseFrequency, noiseOffsetX = this.noiseOffsetX, noiseOffsetY = this.noiseOffsetY) {
        this.noiseStrength = noiseStrength;
        this.noiseFrequency = noiseFrequency;
        this.noiseOffsetX = noiseOffsetX;
        this.noiseOffsetY = noiseOffsetY;
        this.morph((i, position) => {
            let coords = position.normalizeToNew();
            let baseTerrain = this.noiseStrength * 2 * this.noiseEngine.normalizedSimplex3FromVector(coords.scale(noiseFrequency * 5).add(new BABYLON.Vector3(noiseOffsetX, noiseOffsetY, 0)));
            let continents = Math.max(this.noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 5).add(new BABYLON.Vector3(noiseOffsetX, noiseOffsetY, 0))), 0.1) - 0.1;
            let seuil = 0.3;
            continents = Math.min(seuil, continents); // décapitation du relief
            continents *= 10 * noiseStrength;
            let moutains = continents <= 9 * seuil ? 0 : 1 * noiseStrength * this.noiseEngine.normalizedSimplex3FromVector(coords.scale(noiseFrequency * 5).add(new BABYLON.Vector3(noiseOffsetX, noiseOffsetY)));
            moutains = 0;
            let ripples = this.noiseStrength * this.noiseEngine.normalizedSimplex3FromVector(coords.scale(noiseFrequency * 50).add(new BABYLON.Vector3(noiseOffsetX, noiseOffsetY, 0)));
            let elevation = baseTerrain + continents + moutains + ripples;
            let newPosition = position.add(coords.scale(elevation));
            return newPosition;
        });
        this.refreshColors();
    }
    refreshColors() {
        this.color((index, position) => {
            if (position.lengthSquared() > Math.pow(this.radius, 2) + 20 * this.noiseStrength) {
                return new BABYLON.Color4(0, 0.5, 0, 1);
            }
            else {
                //return new BABYLON.Color4(0, 0, 0.5, 1);
                return new BABYLON.Color4(0.5, 0.3, 0.08, 1);
            }
        });
    }
    refreshNoise(noiseStrength = this.noiseStrength, noiseFrequency = this.noiseFrequency, noiseOffsetX = this.noiseOffsetX, noiseOffsetY = this.noiseOffsetY) {
        this.applyNoise(-this.noiseStrength);
        this.applyNoise(noiseStrength, noiseFrequency, noiseOffsetX, noiseOffsetY);
    }
    regenerate(n = this.nbCraters, noiseStrength = this.noiseStrength, noiseFrequency = this.noiseFrequency, noiseOffsetX = this.noiseOffsetX, noiseOffsetY = this.noiseOffsetY) {
        this.applyNoise(-this.noiseStrength);
        this.applyNoise(noiseStrength, noiseFrequency, noiseOffsetX, noiseOffsetY);
        this.generateCraters(n);
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
