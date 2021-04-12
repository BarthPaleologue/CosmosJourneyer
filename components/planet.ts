import { ProceduralSphere } from "./proceduralCube.js";
import { NoiseEngine } from "../engine/perlin.js";
import { Crater } from "./crater.js";
import { CraterLayer } from "./layers/craterLayer.js";
import { CraterModifiers } from "./layers/craterModifiers.js";
import { NoiseLayer } from "./layers/noiseLayer.js";
import { NoiseModifiers } from "./layers/noiseSettings.js";

export class Planet extends ProceduralSphere {

    constructor(_id: string, _radius: number, _position: BABYLON.Vector3, _nbSubdivisions: number, _maxDepth: number, _scene: BABYLON.Scene) {

        let noiseEngine = new NoiseEngine();
        noiseEngine.seed(42);

        let noiseStrength = 1 * _radius;
        let noiseFrequency = 1 / _radius;

        let nbCraters = 1000;
        let craterRadiusFactor = 0.5;
        let craterSteepnessFactor = 1;
        let craterMaxDepthFactor = 1;
        let craters = generateCraters(nbCraters, craterRadiusFactor, craterSteepnessFactor);
        let craterLayer = new CraterLayer(craters);

        let noiseModifiers: NoiseModifiers = {
            strengthModifier: 1,
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: BABYLON.Vector3.Zero(),
            minValueModifier: 1,
        };

        let craterModifiers: CraterModifiers = {
            radiusModifier: 1,
            steepnessModifier: 1,
            maxDepthModifier: 1,
            scaleFactor: 1,
        };

        let barrenBumpyLayer = new NoiseLayer(noiseEngine, {
            noiseStrength: noiseStrength,
            octaves: 10,
            baseAmplitude: 1,
            baseFrequency: noiseFrequency,
            decay: 1.9,
            minValue: 0,
            offset: BABYLON.Vector3.Zero()
        });

        let terrainFunction = function (p: BABYLON.Vector3) {
            let coords = p.normalizeToNew().scale(_radius);

            let elevation = barrenBumpyLayer.evaluate(coords, noiseModifiers);

            elevation += craterLayer.evaluate(coords.normalizeToNew(), craterModifiers) * 1;

            elevation = Math.max(0, elevation);

            let newPosition = p.add(coords.normalizeToNew().scale(elevation * noiseStrength / 10));
            return newPosition;
        };

        super(_id, _radius, _position, _nbSubdivisions, _maxDepth, _scene, terrainFunction);

        //this.noiseEngine = noiseEngine;
        //this.noiseStrength = noiseStrength;
        //this.noiseFrequency = noiseFrequency;
    }

}

function generateCraters(n: number, craterRadiusFactor: number, craterSteepnessFactor: number) {
    let craters = [];
    for (let i = 0; i < n; i++) {
        let r = craterRadiusFactor * (Math.random() ** 10) * 6;
        // random spherical coordinates
        let phi = Math.random() * Math.PI * 2;
        let theta = Math.random() * Math.PI;
        let position = new BABYLON.Vector3(Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi));

        let maxDepth = 0.2 + (Math.random()) / 10;
        let steepness = craterSteepnessFactor * (1 + (Math.random()) / 10);
        craters.push({ radius: r, position: position, maxDepth: maxDepth, steepness: steepness });
    }
    return craters;
}