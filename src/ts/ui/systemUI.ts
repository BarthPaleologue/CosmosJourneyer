import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";

export class SystemUI {
    private readonly gui: AdvancedDynamicTexture;
    constructor(scene: Scene) {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("SystemUI", true, scene);
    }
}
