import {PostProcess, Camera, Scene} from "@babylonjs/core";

export class InvertPostProcess extends PostProcess {

    constructor(name: string, camera: Camera, scene: Scene) {
        super(name, "./shaders/invert", [

        ], [
            "textureSampler",
        ], 1.0, camera);
    }
}