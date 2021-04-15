import { ProceduralSphere } from "./forge/proceduralSphere.js";
import { NoiseEngine } from "../engine/perlin.js";
import { Crater } from "./forge/crater.js";
import { CraterModifiers } from "./forge/layers/craterModifiers.js";
import { NoiseModifiers } from "./forge/layers/noiseSettings.js";

export interface ColorSettings {
    snowColor: number[],
    steepColor: number[],
    plainColor: number[],
    sandColor: number[],
    plainSteepDotLimit: number,
    snowSteepDotLimit: number,
    iceCapThreshold: number,
    waterLevel: number,
}

export class Planet extends ProceduralSphere {

    noiseModifiers: NoiseModifiers;

    craters: Crater[];
    craterModifiers: CraterModifiers;

    colorSettings: ColorSettings;

    constructor(_id: string, _radius: number, _position: BABYLON.Vector3, _nbSubdivisions: number, _maxDepth: number, _scene: BABYLON.Scene) {
        super(_id, _radius, _position, _nbSubdivisions, _maxDepth, _scene);

        let noiseEngine = new NoiseEngine();
        noiseEngine.seed(69);

        let nbCraters = 500;
        let craterRadiusFactor = 0.1;
        let craterSteepnessFactor = 1;
        let craterMaxDepthFactor = 1;

        this.noiseModifiers = {
            strengthModifier: 1,
            amplitudeModifier: 1,
            frequencyModifier: 1,
            offsetModifier: [0, 0, 0],
            minValueModifier: 1,
        };

        this.craterModifiers = {
            radiusModifier: 1,
            steepnessModifier: 1,
            maxDepthModifier: 1,
            scaleFactor: 1,
        };

        this.colorSettings = {
            snowColor: [1, 1, 1, 1],
            steepColor: [0.2, 0.2, 0.2, 1],
            plainColor: [0.5, 0.3, 0.08, 1],
            sandColor: [0.5, 0.5, 0, 1],
            plainSteepDotLimit: 0.95,
            snowSteepDotLimit: 0.94,
            iceCapThreshold: 9,
            waterLevel: 0.32
        };

        this.craters = this.generateCraters(nbCraters, craterRadiusFactor, craterSteepnessFactor, craterMaxDepthFactor);

        this.updateSettings();
    }

    updateSettings() {
        this.chunkForge.setPlanet(this.radius, this.craters, this.noiseModifiers, this.craterModifiers, this.colorSettings);
    }

    generateCraters(n: number, _radius: number, _steepness: number, _maxDepth: number) {
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

}