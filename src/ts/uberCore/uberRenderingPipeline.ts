import { Camera, Engine, FxaaPostProcess, PostProcessRenderEffect, PostProcessRenderPipeline, Texture } from "@babylonjs/core";
import { ColorCorrection } from "./postProcesses/colorCorrection";

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
