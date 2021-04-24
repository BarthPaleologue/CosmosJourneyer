export class AtmosphericScatteringPostProcess extends BABYLON.PostProcess {
    constructor(name, planet, planetRadius, atmosphereRadius, sun, camera) {
        super(name, "./shaders/simplifiedScattering", [
            "sunPosition",
            "cameraPosition",
            "projection",
            "view",
            "planetPosition",
            "planetRadius",
            "atmosphereRadius",
            "falloffFactor",
            "sunIntensity",
            "scatteringStrength",
            "redWaveLength",
            "greenWaveLength",
            "blueWaveLength"
        ], null, 1, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, camera.getEngine(), true);
        this.settings = {
            planetRadius: planetRadius,
            atmosphereRadius: atmosphereRadius,
            falloffFactor: 15,
            intensity: 25,
            scatteringStrength: 1,
            redWaveLength: 700,
            greenWaveLength: 530,
            blueWaveLength: 440,
        };
        this.camera = camera;
        this.sun = sun;
        this.planet = planet;
        this.setCamera(this.camera);
        this.onApply = (effect) => {
            effect.setVector3("sunPosition", this.sun.position);
            effect.setVector3("cameraPosition", this.camera.position);
            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setVector3("planetPosition", this.planet.position);
            effect.setFloat("planetRadius", this.settings.planetRadius);
            effect.setFloat("atmosphereRadius", this.settings.atmosphereRadius);
            effect.setFloat("falloffFactor", this.settings.falloffFactor);
            effect.setFloat("intensity", this.settings.intensity);
            effect.setFloat("scatteringStrength", this.settings.scatteringStrength);
            effect.setFloat("redWaveLength", this.settings.redWaveLength);
            effect.setFloat("greenWaveLength", this.settings.greenWaveLength);
            effect.setFloat("blueWaveLength", this.settings.blueWaveLength);
        };
        this.onBeforeRender = (effect) => {
            effect.setVector3("sunPosition", this.sun.getAbsolutePosition());
            effect.setVector3("cameraPosition", this.camera.position);
            effect.setVector3("planetPosition", this.planet.position);
            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setFloat("planetRadius", this.settings.planetRadius);
            effect.setFloat("atmosphereRadius", this.settings.atmosphereRadius);
            effect.setFloat("falloffFactor", this.settings.falloffFactor);
            effect.setFloat("sunIntensity", this.settings.intensity);
            effect.setFloat("scatteringStrength", this.settings.scatteringStrength);
            effect.setFloat("redWaveLength", this.settings.redWaveLength);
            effect.setFloat("greenWaveLength", this.settings.greenWaveLength);
            effect.setFloat("blueWaveLength", this.settings.blueWaveLength);
        };
    }
    setCamera(camera) {
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}
