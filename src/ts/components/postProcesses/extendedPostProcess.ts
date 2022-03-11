import {Camera, PostProcess, Texture} from "@babylonjs/core";

export abstract class ExtendedPostProcess extends PostProcess {
    camera: Camera;
    protected constructor(name: string, fragmentURL: string, parameters: string[], samplers: string[], camera: Camera) {
        super(name, fragmentURL, parameters, samplers, 1, camera, Texture.BILINEAR_SAMPLINGMODE, camera.getEngine(), false);
        this.camera = camera;
    }
    setCamera(camera: Camera) {
        this.camera.detachPostProcess(this);
        this.camera = camera;
        camera.attachPostProcess(this);
    }
}