import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";

export class SystemUI {
    //private gui: AdvancedDynamicTexture;
    constructor(scene: Scene) {
        //this.gui = AdvancedDynamicTexture.CreateFullscreenUI("SystemUI", true, scene);
        //console.log(this.gui);

        // display system name
        /*const name = new TextBlock();
        name.text = "System Name";
        name.color = "white";
        name.fontSize = 24;
        name.fontWeight = "bold";
        name.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        name.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_TOP;
        name.paddingLeft = "10px";
        name.paddingTop = "10px";
        this.gui.addControl(name);*/
    }
}