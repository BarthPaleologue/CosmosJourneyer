import {
    Camera,
    Engine,
    FxaaPostProcess,
    PostProcessRenderEffect,
    PostProcessRenderPipeline,
    Texture
} from "@babylonjs/core";
import { ColorCorrection } from "./postProcesses/colorCorrection";

export class UberRenderingPipeline extends PostProcessRenderPipeline {
    readonly colorCorrection: ColorCorrection;
    readonly fxaa: FxaaPostProcess;

    readonly colorCorrectionRenderEffect: PostProcessRenderEffect;
    readonly fxaaRenderEffect: PostProcessRenderEffect;

    constructor(name: string, engine: Engine) {
        super(engine, name);

        this.colorCorrection = new ColorCorrection("colorCorrection", engine);
        this.fxaa = new FxaaPostProcess("fxaa", 1, null, Texture.BILINEAR_SAMPLINGMODE, engine);

        this.colorCorrectionRenderEffect = new PostProcessRenderEffect(engine, "colorCorrectionRenderEffect", () => {
            return [this.colorCorrection];
        });
        this.fxaaRenderEffect = new PostProcessRenderEffect(engine, "fxaaRenderEffect", () => {
            return [this.fxaa];
        });
    }

    addColorCorrection() {
        this.addEffect(this.colorCorrectionRenderEffect);
    }

    addFXAA() {
        this.addEffect(this.fxaaRenderEffect);
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
