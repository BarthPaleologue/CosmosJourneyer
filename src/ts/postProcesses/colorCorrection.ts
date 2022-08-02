import { Effect, PostProcess, Scene, Texture } from "@babylonjs/core";
import colorCorrectionFragment from "../../shaders/colorCorrection.glsl";

const shaderName = "colorCorrection";
Effect.ShadersStore[`${shaderName}FragmentShader`] = colorCorrectionFragment;

type ColorCorrectionSettings = {
    brightness: number;
    contrast: number;
    exposure: number;
    gamma: number;
    saturation: number;
}

export class ColorCorrection extends PostProcess {
    settings: ColorCorrectionSettings = {
        brightness: 0,
        contrast: 1,
        exposure: 1.1,
        gamma: 1.2,
        saturation: 0.9
    }
    constructor(name: string, scene: Scene) {
        super(name, shaderName, [
            "brightness",
            "contrast",
            "exposure",
            "gamma",
            "saturation"
        ], [
            "textureSampler"
        ], 1, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine());

        this.onApply = (effect: Effect) => {
            effect.setFloat("brightness", this.settings.brightness);
            effect.setFloat("contrast", this.settings.contrast);
            effect.setFloat("exposure", this.settings.exposure);
            effect.setFloat("gamma", this.settings.gamma);
            effect.setFloat("saturation", this.settings.saturation);
        }
    }
}