import {Axis, Camera, Mesh, PointLight, Scene} from "@babylonjs/core";
import {ExtendedPostProcess} from "./extendedPostProcess";
import {SolidPlanet} from "../celestialBodies/planets/solid/solidPlanet";
import {RingsSettings, ShaderDataType, ShaderSamplerData, ShaderUniformData} from "./interfaces";

export class RingsPostProcess extends ExtendedPostProcess {

    settings: RingsSettings;

    constructor(name: string, planet: SolidPlanet, planetRadius: number, waterLevel: number, sun: Mesh | PointLight, camera: Camera, scene: Scene) {

        let settings = {
            ringStart: 1.5,
            ringEnd: 2.5,
            ringFrequency: 30.0,
            ringOpacity: 0.4
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

            "waterLevel": {
                type: ShaderDataType.Float,
                get: () => {return planet.colorSettings.waterLevel}
            },

            "ringStart": {
                type: ShaderDataType.Float,
                get: () => {return settings.ringStart}
            },
            "ringEnd": {
                type: ShaderDataType.Float,
                get: () => {return settings.ringEnd}
            },
            "ringFrequency": {
                type: ShaderDataType.Float,
                get: () => {return settings.ringFrequency}
            },
            "ringOpacity": {
                type: ShaderDataType.Float,
                get: () => {return settings.ringOpacity}
            },

            "planetWorldMatrix": {
                type: ShaderDataType.Matrix,
                get: () => {return planet.getWorldMatrix()}
            }
        };

        let samplers: ShaderSamplerData = {}

        super(name, "./shaders/rings", uniforms, samplers, camera, scene);

        this.settings = settings;
    }
}