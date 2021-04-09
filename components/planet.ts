import { ProceduralSphere } from "./proceduralSphere.js";
import { NoiseEngine } from "../engine/perlin.js";

export class Planet extends ProceduralSphere {
    noiseEngine: NoiseEngine;
    noiseStrength: number;
    noiseFrequency: number;
    constructor(_id: string, _radius: number, _position: BABYLON.Vector3, _nbSubdivisions: number, _maxDepth: number, _scene: BABYLON.Scene) {

        let noiseEngine = new NoiseEngine();
        noiseEngine.seed(42);

        let noiseStrength = 0.1;
        let noiseFrequency = 0.7 / _radius;

        let terrainFunction = function (p: BABYLON.Vector3) {
            let coords = p.normalizeToNew().scale(_radius);

            let baseTerrain = noiseStrength * noiseEngine.normalizedSimplex3FromVector(coords.scale(noiseFrequency * 5).add(new BABYLON.Vector3(0, 0, 0)));

            let continents = Math.max(noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 5)), 0.1) - 0.1;
            let seuil = 0.3;
            continents = Math.min(seuil, continents); // décapitation du relief
            continents *= 0.3 * _radius * noiseStrength;

            let moutains = continents <= 9 * seuil ? 0 : 1 * 1 * noiseEngine.normalizedSimplex3FromVector(coords.scale(noiseFrequency * 5).add(new BABYLON.Vector3(0, 0, 0)));
            moutains = 0;

            let ripples = noiseStrength * noiseEngine.normalizedSimplex3FromVector(coords.scale(noiseFrequency * 100).add(new BABYLON.Vector3(0, 0, 0)));

            let elevation = baseTerrain + continents + moutains + ripples;

            let newPosition = p.add(coords.normalizeToNew().scale(elevation));
            return newPosition;
        };

        super(_id, _radius, _position, _nbSubdivisions, _maxDepth, _scene, terrainFunction);

        this.noiseEngine = noiseEngine;
        this.noiseStrength = noiseStrength;
        this.noiseFrequency = noiseFrequency;
    }

}