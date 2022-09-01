import { DepthRenderer, FreeCamera, Vector3 } from "@babylonjs/core";
import { UberScene } from "./uberScene";

export class UberFreeCamera extends FreeCamera {
    readonly depthRenderer: DepthRenderer;
    constructor(name: string, position: Vector3, scene: UberScene) {
        super(name, position, scene);
        this.depthRenderer = scene.enableDepthRenderer(this, false, true);
        scene.customRenderTargets.push(this.depthRenderer.getDepthMap());
    }
}