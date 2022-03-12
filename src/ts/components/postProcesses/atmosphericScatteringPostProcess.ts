import {Camera, Mesh, PointLight, Scene, Axis} from "@babylonjs/core";

import { SolidPlanet } from "../celestialBodies/planets/solid/solidPlanet";
import {ExtendedPostProcess} from "./extendedPostProcess";

import {AtmosphereSettings, ShaderUniformData, ShaderSamplerData, ShaderDataType} from "./interfaces";

export class AtmosphericScatteringPostProcess extends ExtendedPostProcess {

    settings: AtmosphereSettings;

    constructor(name: string, planet: SolidPlanet, planetRadius: number, atmosphereRadius: number, sun: Mesh | PointLight, camera: Camera, scene: Scene) {

        let settings: AtmosphereSettings = {
            atmosphereRadius: atmosphereRadius,
            falloffFactor: 24,
            intensity: 20,
            scatteringStrength: 1,
            densityModifier: 1,
            redWaveLength: 700,
            greenWaveLength: 530,
            blueWaveLength: 440,
        };

        let uniforms: ShaderUniformData = {
            "sunPosition": {
                type: ShaderDataType.Vector3,
                get: () => {return sun.getAbsolutePosition()}
            },
            "planetPosition": {
                type: ShaderDataType.Vector3,
                get: () => {return planet.getAbsolutePosition()}
            },
            "cameraDirection": {
                type: ShaderDataType.Vector3,
                get: () => {return scene.activeCamera!.getDirection(Axis.Z)}
            },

            "planetRadius": {
                type: ShaderDataType.Float,
                get: () => {return planet.getRadius()}
            },
            "atmosphereRadius": {
                type: ShaderDataType.Float,
                get: () => {return settings.atmosphereRadius}
            },
            "waterLevel": {
                type: ShaderDataType.Float,
                get: () => {return planet.colorSettings.waterLevel}
            },

            "falloffFactor": {
                type: ShaderDataType.Float,
                get: () => {return settings.falloffFactor}
            },
            "sunIntensity": {
                type: ShaderDataType.Float,
                get: () => {return settings.intensity}
            },
            "scatteringStrength": {
                type: ShaderDataType.Float,
                get: () => {return settings.scatteringStrength}
            },
            "densityModifier": {
                type: ShaderDataType.Float,
                get: () => {return settings.densityModifier}
            },
            "redWaveLength": {
                type: ShaderDataType.Float,
                get: () => {return settings.redWaveLength}
            },
            "greenWaveLength": {
                type: ShaderDataType.Float,
                get: () => {return settings.greenWaveLength}
            },
            "blueWaveLength": {
                type: ShaderDataType.Float,
                get: () => {return settings.blueWaveLength}
            }
        };

        let samplers: ShaderSamplerData = {}

        super(name, "./shaders/simplifiedScattering", uniforms, samplers, camera, scene);

        this.settings = settings;
    }
}