import { Camera, Engine, PostProcessRenderPipeline } from "@babylonjs/core";

export class UberRenderingPipeline extends PostProcessRenderPipeline {
    constructor(name: string, engine: Engine) {
        super(engine, name);
    }

    attachToCamera(camera: Camera) {
        this._attachCameras([camera], false);
    }

    detachCamera(camera: Camera) {
        this._detachCameras([camera]);
    }

    detachCameras() {
        this._detachCameras(this.cameras);
    }
}
