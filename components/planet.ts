import { ProceduralSphere } from "./proceduralCube.js";
import { NoiseEngine } from "../engine/perlin.js";

export class Planet extends ProceduralSphere {
    noiseEngine: NoiseEngine;
    noiseStrength: number;
    noiseFrequency: number;
    constructor(_id: string, _radius: number, _position: BABYLON.Vector3, _nbSubdivisions: number, _maxDepth: number, _scene: BABYLON.Scene) {

        let noiseEngine = new NoiseEngine();
        noiseEngine.seed(42);

        let noiseStrength = 0.1 * _radius;
        let noiseFrequency = 0.7 / _radius;

        let terrainFunction = function (p: BABYLON.Vector3) {
            let coords = p.normalizeToNew().scale(_radius);

            let baseTerrain = noiseStrength * noiseEngine.normalizedSimplex3FromVector(coords.scale(noiseFrequency * 5).add(new BABYLON.Vector3(0, 0, 0)));

            let continents = Math.max(noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 5)), 0.1) - 0.1;
            let seuil = 0.3;
            continents = Math.min(seuil, continents); // décapitation du relief
            continents *= 100 * noiseStrength;

            let moutains = 0;
            if (continents > 95 * seuil * noiseStrength) moutains = 40 * noiseStrength * noiseEngine.normalizedSimplex3FromVector(coords.scale(noiseFrequency * 20));

            let erosion = 0;
            if (continents > 0.5 * seuil * noiseStrength) erosion = 2 * noiseStrength * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 100));

            let ripples = noiseStrength * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 100));

            let elevation = baseTerrain + continents + moutains + erosion + ripples;

            elevation = 7 * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency)) +
                4 * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 2)) +
                2 * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 4)) +
                1 * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 8)) +
                0.5 * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 16)) +
                0.35 * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 32)) +
                0.2 * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 64)) +
                0.1 * noiseEngine.simplex3FromVector(coords.scale(noiseFrequency * 128));

            let newPosition = p.add(coords.normalizeToNew().scale(elevation * noiseStrength / 10));
            return newPosition;
        };

        super(_id, _radius, _position, _nbSubdivisions, _maxDepth, _scene, terrainFunction);

        this.noiseEngine = noiseEngine;
        this.noiseStrength = noiseStrength;
        this.noiseFrequency = noiseFrequency;
    }

}