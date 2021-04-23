interface AtmosphereModifiers {
    intensityModifier: number,
    betaRayleighModifier: number,
    atmosphereRadiusModifier: number,
    falloffModifier: number,
    maxHeightModifier: number,
    rayleighScaleModifier: number,
    mieScaleModifier: number,
}

export class AtmosphericScatteringPostProcess extends BABYLON.PostProcess {

    modifiers: AtmosphereModifiers;

    constructor(name: string, mesh: BABYLON.Mesh, meshRadius: number, atmosphereRadius: number, sun: BABYLON.Mesh | BABYLON.PointLight, camera: BABYLON.TargetCamera) {
        super(name, "./shaders/simplifiedScattering", [
            "sunPosition",

            "cameraPosition",

            "camTransform",
            "projection",
            "view",
            "camDir",

            "planetPosition",
            "planetRadius",
            "atmosphereRadius",

            "depthData",

            "intensityModifier",
            "betaRayleighModifier",
            "falloffModifier",
            "maxHeightModifier",
            "rayleighScaleModifier",
            "mieScaleModifier"
        ], null, 1, camera);

        let scene = camera.getScene();
        let depth = scene.enableDepthRenderer();

        this.modifiers = {
            intensityModifier: 1,
            betaRayleighModifier: 1,
            atmosphereRadiusModifier: 1,
            falloffModifier: 1,
            maxHeightModifier: 1,
            rayleighScaleModifier: 1,
            mieScaleModifier: 1,
        };

        this.onApply = (effect: BABYLON.Effect) => {
            effect.setVector3("sunPosition", sun.position);

            effect.setVector3("cameraPosition", camera.position);

            effect.setMatrix("camTransform", camera.getTransformationMatrix());
            effect.setMatrix("projection", camera.getProjectionMatrix());
            effect.setMatrix("view", camera.getViewMatrix());
            effect.setVector3("camDir", camera.getTarget());

            effect.setTexture("depthData", depth.getDepthMap());

            effect.setVector3("planetPosition", mesh.position);
            effect.setFloat("planetRadius", meshRadius);
            effect.setFloat("atmosphereRadius", atmosphereRadius * this.modifiers.atmosphereRadiusModifier);

            effect.setFloat("intensityModifier", this.modifiers.intensityModifier);
            effect.setFloat("betaRayleighModifier", this.modifiers.betaRayleighModifier);
            effect.setFloat("falloffModifier", this.modifiers.falloffModifier);
            effect.setFloat("maxHeightModifier", this.modifiers.maxHeightModifier);
            effect.setFloat("rayleighScaleModifier", this.modifiers.rayleighScaleModifier);
            effect.setFloat("mieScaleModifier", this.modifiers.mieScaleModifier);
        };

        this.onBeforeRender = (effect: BABYLON.Effect) => {
            effect.setVector3("sunPosition", sun.getAbsolutePosition());

            effect.setVector3("planetPosition", mesh.position);

            effect.setVector3("cameraPosition", camera.position);

            effect.setMatrix("camTransform", camera.getTransformationMatrix());
            effect.setMatrix("projection", camera.getProjectionMatrix());
            effect.setMatrix("view", camera.getViewMatrix());
            effect.setVector3("camDir", camera.getTarget());

            effect.setTexture("depthData", depth.getDepthMap());

            effect.setFloat("atmosphereRadius", atmosphereRadius * this.modifiers.atmosphereRadiusModifier);

            effect.setFloat("intensityModifier", this.modifiers.intensityModifier);
            effect.setFloat("betaRayleighModifier", this.modifiers.betaRayleighModifier);
            effect.setFloat("falloffModifier", this.modifiers.falloffModifier);
            effect.setFloat("maxHeightModifier", this.modifiers.maxHeightModifier);
            effect.setFloat("rayleighScaleModifier", this.modifiers.rayleighScaleModifier);
            effect.setFloat("mieScaleModifier", this.modifiers.mieScaleModifier);
        };
    }
}