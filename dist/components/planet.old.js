import { ProceduralEngine } from "../engine/proceduralEngine.js";
import { proceduralMesh } from "../engine/proceduralMesh.js";
import { CraterLayer } from "./forge/layers/craterLayer.js";
import { SimplexNoiseLayer } from "./forge/layers/simplexNoiseLayer.js";
import { Vector3 } from "./forge/algebra.js";
export class Planet extends proceduralMesh {
    constructor(_id, _size, _subdivisions, _position, _scene) {
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
        this.noiseLayers = [];
        this.radius = _size / 2;
        this.subdivisions = _subdivisions;
        let barrenBumpyLayer = new SimplexNoiseLayer(1, 5, 2, 2, 0);
        let continentsLayer = new SimplexNoiseLayer(1, 5, 2, 2, 0.2);
        let moutainsLayer = new SimplexNoiseLayer(0.1, 6, 2, 2, 0);
        this.noiseModifiers = {
            strengthModifier: 1,
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: [0, 0, 0],
            minValueModifier: 1,
            archipelagoFactor: 0.5
        };
        this.craterModifiers = {
            radiusModifier: 1,
            steepnessModifier: 1,
            maxDepthModifier: 1,
            scaleFactor: 1,
        };
        this.noiseLayers.push(continentsLayer);
        this.noiseLayers.push(moutainsLayer);
        this.craterLayer = new CraterLayer(this.generateCraters(this.nbCraters));
        this.mesh = ProceduralEngine.createPlanet(_size, _subdivisions, this.scene);
        this.mesh.forceSharedVertices();
        this.mesh.position = this.position;
        this.mesh.material = this.material;
        this.material.specularColor = new BABYLON.Color3(.0, .0, .0);
        this.applyTerrain();
    }
    generateCraters(n) {
        this.nbCraters += n;
        let craters = [];
        for (let i = 0; i < n; i++) {
            let r = this.craterRadiusFactor * (Math.pow(Math.random(), 10)) * 6;
            // random spherical coordinates
            let phi = Math.random() * Math.PI * 2;
            let theta = Math.random() * Math.PI;
            let position = [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)];
            let maxDepth = 0.2 + (Math.random()) / 10;
            let steepness = this.craterSteepnessFactor * (1 + (Math.random()) / 10);
            let crater = { radius: r, position: position, maxDepth: maxDepth, steepness: steepness };
            craters.push(crater);
        }
        return craters;
    }
    regenerateCraters(n = this.nbCraters) {
        this.craterLayer.regenerate(this.generateCraters(n));
    }
    applyTerrain() {
        this.morph((i, position) => {
            let normalizedPosition = position.normalizeToNew();
            let elevation = this.terrainFunction(position);
            let newPosition = normalizedPosition.scale(this.radius).add(normalizedPosition.scale(elevation));
            return newPosition;
        });
        this.refreshColors();
    }
    terrainFunction(p) {
        let coords = p.normalizeToNew();
        let coords2 = new Vector3(coords.x, coords.y, coords.z);
        let elevation = 0;
        for (let layer of this.noiseLayers) {
            let maskFactor = 1;
            elevation += layer.evaluate(coords2);
        }
        elevation += this.craterLayer.evaluate(coords2, this.craterModifiers);
        return elevation;
    }
    refreshColors() {
        this.color((index, position) => {
            let elevation = this.terrainFunction(position);
            return this.colorFunction(elevation);
        });
    }
    colorFunction(elevation) {
        let relativeElevation = elevation * this.noiseStrength * this.noiseModifiers.strengthModifier;
        if (relativeElevation > 0.3) { // ice
            return new BABYLON.Color4(1, 1, 1, 1);
        }
        else if (relativeElevation > 0.1) { // grass
            return new BABYLON.Color4(0, 0.5, 0, 1);
        }
        else if (relativeElevation > 0.02) { // sand
            return new BABYLON.Color4(0.5, 0.5, 0, 1);
        }
        else { // roc
            return new BABYLON.Color4(0.5, 0.3, 0.08, 1);
        }
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
