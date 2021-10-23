

export class InvertPostProcess extends BABYLON.PostProcess {

    constructor(name: string, camera: BABYLON.Camera, scene: BABYLON.Scene) {
        super(name, "./shaders/invert", [

        ], [
            "textureSampler",
        ], 1.0, camera);
    }
}