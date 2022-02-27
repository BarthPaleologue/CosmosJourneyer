import { SolidPlanet } from "../celestialBodies/planets/solid/solidPlanet";

interface AtmosphereSettings {
    planetRadius: number,
    atmosphereRadius: number,
    falloffFactor: number,
    intensity: number,
    scatteringStrength: number,
    densityModifier: number,
    redWaveLength: number,
    greenWaveLength: number,
    blueWaveLength: number,
}

export class AtmosphericScatteringPostProcess extends BABYLON.PostProcess {

    settings: AtmosphereSettings;
    camera: BABYLON.Camera;
    sun: BABYLON.Mesh | BABYLON.PointLight;
    planetMesh: BABYLON.Mesh;

    constructor(name: string, planet: SolidPlanet, planetRadius: number, atmosphereRadius: number, sun: BABYLON.Mesh | BABYLON.PointLight, camera: BABYLON.Camera, scene: BABYLON.Scene) {
        super(name, "./shaders/simplifiedScattering", [
            "sunPosition",
            "cameraPosition",

            "projection",
            "view",
            "transform",

            "cameraNear",
            "cameraFar",
            "cameraDirection",

            "planetPosition",
            "planetRadius",
            "atmosphereRadius",
            "waterLevel",

            "falloffFactor",
            "sunIntensity",
            "scatteringStrength",
            "densityModifier",

            "redWaveLength",
            "greenWaveLength",
            "blueWaveLength"
        ], [
            "textureSampler",
            "depthSampler",
        ], 1, scene.activeCamera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);

        this.settings = {
            planetRadius: planetRadius,
            atmosphereRadius: atmosphereRadius,
            falloffFactor: 15,
            intensity: 15,
            scatteringStrength: 1,
            densityModifier: 1,
            redWaveLength: 700,
            greenWaveLength: 530,
            blueWaveLength: 440,
        };

        this.camera = camera;
        this.sun = sun;
        this.planetMesh = planet.attachNode;

        this.setCamera(this.camera);

        this.onApply = (effect: BABYLON.Effect) => {

            effect.setTexture("depthSampler", scene.customRenderTargets[0]);

            effect.setVector3("sunPosition", this.sun.getAbsolutePosition());
            effect.setVector3("cameraPosition", BABYLON.Vector3.Zero());

            effect.setVector3("planetPosition", this.planetMesh.getAbsolutePosition());

            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setMatrix("transform", this.camera.getTransformationMatrix());

            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
            effect.setVector3("cameraDirection", camera.getDirection(BABYLON.Axis.Z));

            effect.setFloat("planetRadius", this.settings.planetRadius);
            effect.setFloat("atmosphereRadius", this.settings.atmosphereRadius);
            effect.setFloat("waterLevel", planet.colorSettings.waterLevel);

            effect.setFloat("falloffFactor", this.settings.falloffFactor);
            effect.setFloat("sunIntensity", this.settings.intensity);
            effect.setFloat("scatteringStrength", this.settings.scatteringStrength);
            effect.setFloat("densityModifier", this.settings.densityModifier);

            effect.setFloat("redWaveLength", this.settings.redWaveLength);
            effect.setFloat("greenWaveLength", this.settings.greenWaveLength);
            effect.setFloat("blueWaveLength", this.settings.blueWaveLength);
        };
    }

    setCamera(camera: BABYLON.Camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}