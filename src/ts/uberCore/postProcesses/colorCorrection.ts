import { Effect, Engine, PostProcess, Texture } from "@babylonjs/core";
import colorCorrectionFragment from "../../../shaders/colorCorrection.glsl";

const shaderName = "colorCorrection";
Effect.ShadersStore[`${shaderName}FragmentShader`] = colorCorrectionFragment;

export class ColorCorrection extends PostProcess {
    brightness = 0;
    contrast = 1;
    exposure = 1;
    gamma = 1;
    saturation = 1;

    constructor(name: string, engine: Engine) {
        super(name, shaderName, ["brightness", "contrast", "exposure", "gamma", "saturation"], ["textureSampler"], 1, null, Texture.BILINEAR_SAMPLINGMODE, engine);

        this.onApplyObservable.add((effect: Effect) => {
            effect.setFloat("brightness", this.brightness);
            effect.setFloat("contrast", this.contrast);
            effect.setFloat("exposure", this.exposure);
            effect.setFloat("gamma", this.gamma);
            effect.setFloat("saturation", this.saturation);
        });
    }
}
