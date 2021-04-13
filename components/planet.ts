import { ProceduralSphere } from "./proceduralCube.js";
import { NoiseEngine } from "../engine/perlin.js";
import { Crater } from "./crater.js";
import { CraterLayer } from "./layers/craterLayer.js";
import { CraterModifiers } from "./layers/craterModifiers.js";
import { NoiseLayer } from "./layers/noiseLayer.js";
import { NoiseModifiers } from "./layers/noiseSettings.js";

export class Planet extends ProceduralSphere {

    noiseLayers: NoiseLayer[];
    noiseModifiers: NoiseModifiers;

    craterLayer: CraterLayer;
    craterModifiers: CraterModifiers;

    constructor(_id: string, _radius: number, _position: BABYLON.Vector3, _nbSubdivisions: number, _maxDepth: number, _scene: BABYLON.Scene) {
        super(_id, _radius, _position, _nbSubdivisions, _maxDepth, _scene);

        let noiseEngine = new NoiseEngine();
        noiseEngine.seed(69);

        let noiseStrength = 1 * _radius;
        let noiseFrequency = 1 / _radius;

        let nbCraters = 500;
        let craterRadiusFactor = 0.1;
        let craterSteepnessFactor = 1;
        let craterMaxDepthFactor = 1;
        let craters = generateCraters(nbCraters, craterRadiusFactor, craterSteepnessFactor, craterMaxDepthFactor);

        this.craterLayer = new CraterLayer(craters);

        this.noiseModifiers = {
            strengthModifier: 1,
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: BABYLON.Vector3.Zero(),
            minValueModifier: 1,
        };

        this.craterModifiers = {
            radiusModifier: 1,
            steepnessModifier: 1,
            maxDepthModifier: 1,
            scaleFactor: 1,
        };

        let barrenBumpyLayer = new NoiseLayer(noiseEngine, {
            noiseStrength: noiseStrength,
            octaves: 10,
            baseAmplitude: 0.5,
            baseFrequency: noiseFrequency,
            decay: 1.9,
            minValue: 0,
            offset: BABYLON.Vector3.Zero()
        });

        let continentsLayer = new NoiseLayer(noiseEngine, {
            noiseStrength: noiseStrength,
            octaves: 10,
            baseAmplitude: 1,
            baseFrequency: noiseFrequency,
            decay: 2,
            minValue: 0.1,
            offset: BABYLON.Vector3.Zero()
        });

        let moutainsLayer = new NoiseLayer(noiseEngine, {
            noiseStrength: noiseStrength,
            octaves: 7,
            baseAmplitude: 0.5,
            baseFrequency: noiseFrequency,
            decay: 2,
            minValue: 0,
            offset: BABYLON.Vector3.Zero()
        }, [0]);

        this.noiseLayers = [];
        this.noiseLayers.push(continentsLayer, moutainsLayer, barrenBumpyLayer);

        this.chunkForge.craters = craters;
    }

}

function generateCraters(n: number, _radius: number, _steepness: number, _maxDepth: number) {
    let craters: Crater[] = [];
    for (let i = 0; i < n; i++) {
        let r = _radius * (Math.random() ** 10);
        // random spherical coordinates
        let phi = Math.random() * Math.PI * 2;
        let theta = Math.random() * Math.PI;
        let position = [Math.cos(theta) * Math.sin(phi), Math.sin(theta) * Math.sin(phi), Math.cos(phi)];

        let maxDepth = _maxDepth * (0.2 + (Math.random()) / 10);
        let steepness = _steepness * (1 + (Math.random()) / 10) / (r / 2);
        craters.push({ radius: r, position: position, maxDepth: maxDepth, steepness: steepness });
    }
    return craters;
}