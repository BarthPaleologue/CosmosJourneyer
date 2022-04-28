import {PostProcess, Camera} from "@babylonjs/core";

export class InvertPostProcess extends PostProcess {

    constructor(name: string, camera: Camera) {
        super(name, "./shaders/invert", [

        ], [
            "textureSampler",
        ], 1.0, camera);
    }
}