import {Axis, Camera, Mesh, PointLight, Scene} from "@babylonjs/core";
import {ExtendedPostProcess} from "./extendedPostProcess";
import {SolidPlanet} from "../celestialBodies/planets/solid/solidPlanet";
import {ShaderDataType, ShaderSamplerData, ShaderUniformData, VolumetricCloudSettings} from "./interfaces";

export class VolumetricCloudsPostProcess extends ExtendedPostProcess {

    settings: VolumetricCloudSettings;

    constructor(name: string, planet: SolidPlanet, planetRadius: number, atmosphereRadius: number, sun: Mesh | PointLight, camera: Camera, scene: Scene) {

        let settings = {
            planetRadius: planetRadius,
            atmosphereRadius: atmosphereRadius
        }

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
            }
        };

        let samplers: ShaderSamplerData = {}

        super(name, "./shaders/volumetricClouds", uniforms, samplers, camera, scene);

        this.settings = settings;
    }
}