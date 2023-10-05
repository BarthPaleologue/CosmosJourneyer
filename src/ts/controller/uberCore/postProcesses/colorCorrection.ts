import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import colorCorrectionFragment from "../../../../shaders/colorCorrection.glsl";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Effect } from "@babylonjs/core/Materials/effect";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

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
