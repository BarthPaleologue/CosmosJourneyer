import { PlayerControler } from "../player/playerControler";
import { CraterLayer } from "../terrain/crater/craterLayer";

interface StarfieldSettings {

}

export class StarfieldPostProcess extends BABYLON.PostProcess {

    settings: StarfieldSettings;
    camera: BABYLON.Camera;

    internalTime = 0;

    constructor(name: string, player: PlayerControler, sun: BABYLON.Mesh | BABYLON.Light, scene: BABYLON.Scene) {
        super(name, "./shaders/starfield", [
            "sunPosition",
            "cameraPosition",

            "projection",
            "view",
            "transform",

            "cameraNear",
            "cameraFar",

            "visibility",

            "time"
        ], [
            "textureSampler",
            "depthSampler",
        ], 1, player.camera, BABYLON.Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false);

        this.camera = player.camera;

        this.setCamera(this.camera);

        this.settings = {};

        let depthMap = scene.customRenderTargets[0];

        this.onApply = (effect: BABYLON.Effect) => {
            this.internalTime += this.getEngine().getDeltaTime();

            effect.setTexture("depthSampler", depthMap);

            effect.setVector3("cameraPosition", this.camera.position);

            let vis = 1.0 - BABYLON.Vector3.Dot(sun.getAbsolutePosition().normalizeToNew(), this.camera.getDirection(BABYLON.Axis.Z));
            vis /= 2;

            effect.setFloat("visibility", vis);

            effect.setMatrix("projection", this.camera.getProjectionMatrix());
            effect.setMatrix("view", this.camera.getViewMatrix());

            effect.setFloat("cameraNear", this.camera.minZ);
            effect.setFloat("cameraFar", this.camera.maxZ);

            effect.setFloat("time", this.internalTime);
        };
    }

    setCamera(camera: BABYLON.Camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}