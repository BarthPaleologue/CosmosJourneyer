import { ProceduralSphere } from "./forge/proceduralSphere.js";
import { NoiseEngine } from "../engine/perlin.js";
import { Crater } from "./forge/crater.js";
import { CraterModifiers } from "./forge/layers/craterModifiers.js";
import { NoiseModifiers } from "./forge/layers/noiseSettings.js";

export interface ColorSettings {
    snowColor: BABYLON.Vector4,
    steepColor: BABYLON.Vector4,
    plainColor: BABYLON.Vector4,
    sandColor: BABYLON.Vector4,
    plainSteepDotLimit: number,
    snowSteepDotLimit: number,
    iceCapThreshold: number,
    waterLevel: number,
    sandSize: number,
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
            snowColor: new BABYLON.Vector4(1, 1, 1, 1),
            steepColor: new BABYLON.Vector4(0.2, 0.2, 0.2, 1),
            plainColor: new BABYLON.Vector4(0.5, 0.3, 0.08, 1),
            sandColor: new BABYLON.Vector4(0.5, 0.5, 0, 1),
            plainSteepDotLimit: 0.95,
            snowSteepDotLimit: 0.94,
            iceCapThreshold: 9,
            waterLevel: 0.32,
            sandSize: 1,
        };

        this.craters = this.generateCraters(nbCraters, craterRadiusFactor, craterSteepnessFactor, craterMaxDepthFactor);

        this.updateSettings();

        let surfaceMaterial = new BABYLON.ShaderMaterial("surfaceColor", _scene, "./shaders/surfaceColor",
            {
                attributes: ["position", "normal"],
                uniforms: ["world", "worldViewProjection"]
            });

        surfaceMaterial.setVector3("v3CameraPos", BABYLON.Vector3.Zero());
        surfaceMaterial.setVector3("v3LightPos", BABYLON.Vector3.Zero());

        this.setChunkMaterial(surfaceMaterial);

        this.updateColors();
    }

    updateColors() {
        this.surfaceMaterial.setFloat("planetRadius", this.radius);
        this.surfaceMaterial.setFloat("iceCapThreshold", this.colorSettings.iceCapThreshold);
        this.surfaceMaterial.setFloat("steepSnowDotLimit", this.colorSettings.snowSteepDotLimit);
        this.surfaceMaterial.setFloat("waterLevel", this.colorSettings.waterLevel);
        this.surfaceMaterial.setFloat("sandSize", this.colorSettings.sandSize);

        this.surfaceMaterial.setVector4("snowColor", this.colorSettings.snowColor);
        this.surfaceMaterial.setVector4("steepColor", this.colorSettings.steepColor);
        this.surfaceMaterial.setVector4("plainColor", this.colorSettings.plainColor);
        this.surfaceMaterial.setVector4("sandColor", this.colorSettings.sandColor);
    }

    update(position: BABYLON.Vector3, facingDirection: BABYLON.Vector3, lightPosition: BABYLON.Vector3) {
        this.surfaceMaterial.setVector3("v3CameraPos", position);
        this.surfaceMaterial.setVector3("v3LightPos", lightPosition);
        this.updateLOD(position, facingDirection);
    }

    updateSettings() {
        this.chunkForge.setPlanet(this.radius, this.craters, this.noiseModifiers, this.craterModifiers);
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