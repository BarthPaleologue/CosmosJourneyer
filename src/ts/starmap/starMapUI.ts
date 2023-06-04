import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Image } from "@babylonjs/gui/2D/controls/image";

import hoveredCircle from "../../asset/textures/hoveredCircle.png"
import { Animation } from "@babylonjs/core/Animations/animation";
import { Scene } from "@babylonjs/core/scene";

export class StarMapUI {
    readonly gui: AdvancedDynamicTexture;
    readonly namePlate: StackPanel;
    readonly nameLabel: TextBlock;
    readonly warpButton: Button;

    readonly hoveringImage: Image;

    readonly scene: Scene;

    static ALPHA_ANIMATION = new Animation("alphaAnimation", "alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    constructor(scene: Scene) {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("UI", true, scene);
        this.scene = scene;

        this.namePlate = new StackPanel();
        this.namePlate.width = "250px";
        //this.namePlate.height = "150px";
        this.namePlate.color = "white";
        this.namePlate.background = "black";
        this.namePlate.linkOffsetY = -150;
        this.namePlate.zIndex = 5;

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

        this.hoveringImage = new Image("hoverImage", hoveredCircle)
        this.hoveringImage.width = 0.2;
        this.hoveringImage.autoScale = true;
        this.hoveringImage.alpha = 0.5;
        this.hoveringImage.zIndex = 4;

        StarMapUI.ALPHA_ANIMATION.setKeys([
            { frame: 0, value: 0.0 },
            { frame: 15, value: 0.8 },
            { frame: 30, value: 0.8 },
            { frame: 45, value: 0.8 },
            { frame: 60, value: 0.8 }
        ]);
    }

    update() {
        if (this.namePlate.linkedMesh === null) this.gui.removeControl(this.namePlate);
    }

    attachUIToMesh(mesh: AbstractMesh) {
        this.gui._linkedControls = [];
        if (this.gui._linkedControls.length === 0) this.gui.addControl(this.namePlate);

        this.namePlate.linkWithMesh(mesh);
    }

    setHoveredMesh(mesh: AbstractMesh | null) {
        if (mesh !== null) {
            let distance = mesh.getAbsolutePosition().length();
            this.hoveringImage.scaleX = 1 / distance;
            this.hoveringImage.scaleY = 1 / distance;


            this.hoveringImage.animations = [StarMapUI.ALPHA_ANIMATION];
            this.scene.beginAnimation(this.hoveringImage, 0, 60, false, 0.5, () => {
                this.hoveringImage.alpha = 0.8;
            });

            this.gui.addControl(this.hoveringImage);
        } else {
            this.gui.removeControl(this.hoveringImage);
        }
        this.hoveringImage.linkWithMesh(mesh);
    }

    detachUIFromMesh() {
        this.namePlate.linkWithMesh(null);
        this.gui.removeControl(this.namePlate);
    }

    getCurrentPickedMesh() {
        return this.namePlate.linkedMesh;
    }

    getCurrentHoveredMesh() {
        return this.hoveringImage.linkedMesh;
    }

    setUIText(text: string) {
        this.nameLabel.text = text;
    }
}
