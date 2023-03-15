import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";

export class StarMapUI {
    readonly gui: AdvancedDynamicTexture;
    readonly namePlate: StackPanel;
    readonly nameLabel: TextBlock;
    readonly warpButton: Button;

    constructor() {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.namePlate = new StackPanel();
        this.namePlate.width = "250px";
        //this.namePlate.height = "150px";
        this.namePlate.color = "white";
        this.namePlate.background = "black";
        this.namePlate.linkOffsetY = -100;

        this.nameLabel = new TextBlock();
        this.nameLabel.height = "100px";
        this.nameLabel.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.nameLabel.setPadding(10, 15, 10, 15);

        this.warpButton = Button.CreateSimpleButton("warpButton", "WARP");
        //this.warpButton.width = "100px";
        this.warpButton.height = "40px";
        this.warpButton.background = "darkgreen";
        this.warpButton.fontWeight = "bold";
        //this.warpButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;

        this.namePlate.addControl(this.nameLabel);
        this.namePlate.addControl(this.warpButton);
    }

    update() {
        if (this.namePlate.linkedMesh == null) this.gui.removeControl(this.namePlate);
    }

    attachUIToMesh(mesh: AbstractMesh) {
        if (this.gui._linkedControls.length == 0) this.gui.addControl(this.namePlate);

        this.namePlate.linkWithMesh(mesh);
    }

    setUIText(text: string) {
        this.nameLabel.text = text;
    }
}
