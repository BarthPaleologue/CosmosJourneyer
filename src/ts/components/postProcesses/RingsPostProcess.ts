interface RingsSettings {

}

export class RingsPostProcess extends BABYLON.PostProcess {

    settings: RingsSettings;
    camera: BABYLON.Camera;
    sun: BABYLON.Mesh | BABYLON.PointLight;
    planet: BABYLON.Mesh;

    internalTime = 0;

    constructor(name: string, planet: BABYLON.Mesh, planetRadius: number, waterLevel: number, cloudLayerRadius: number, sun: BABYLON.Mesh | BABYLON.PointLight, camera: BABYLON.Camera, scene: BABYLON.Scene) {
        super(name, "./shaders/rings", [
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
            "cloudLayerRadius",
            "waterLevel",

            "planetWorldMatrix",

            "time"
        ], [
            "textureSampler",
            "depthSampler",
        ], 1, camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);


        this.settings = {

        };

        this.camera = camera;
        this.sun = sun;
        this.planet = planet;

        this.setCamera(this.camera);

        let depthRenderer = new BABYLON.DepthRenderer(scene);
        scene.customRenderTargets.push(depthRenderer.getDepthMap());
        let depthMap = scene.customRenderTargets[0];


        this.onApply = (effect: BABYLON.Effect) => {
            this.internalTime += this.getEngine().getDeltaTime();

            effect.setTexture("depthSampler", depthMap);

            effect.setVector3("sunPosition", this.sun.getAbsolutePosition());
            effect.setVector3("cameraPosition", this.camera.position);

            effect.setVector3("planetPosition", this.planet.getAbsolutePosition());
            effect.setFloat("planetRadius", planetRadius);
            effect.setFloat("waterLevel", waterLevel);

            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());
            effect.setMatrix("transform", this.camera.getTransformationMatrix());

            effect.setFloat("cameraNear", camera.minZ);
            effect.setFloat("cameraFar", camera.maxZ);
            effect.setVector3("cameraDirection", camera.getDirection(BABYLON.Axis.Z));

            effect.setMatrix("planetWorldMatrix", this.planet.getWorldMatrix());

            effect.setFloat("time", this.internalTime);
        };
    }

    setCamera(camera: BABYLON.Camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}