import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Button } from "@babylonjs/gui/2D/controls/button";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { Image } from "@babylonjs/gui/2D/controls/image";

import hoveredCircle from "../../asset/textures/hoveredCircle.png";
import selectedCircle from "../../asset/textures/selectedCircle.png";

import { Animation } from "@babylonjs/core/Animations/animation";
import { Scene } from "@babylonjs/core/scene";

export class StarMapUI {
    readonly gui: AdvancedDynamicTexture;
    readonly namePlate: StackPanel;
    readonly nameLabel: TextBlock;
    readonly warpButton: Button;

    readonly hoveredSystemRing: Image;
    readonly currentSystemRing: Image;

    readonly scene: Scene;

    static ALPHA_ANIMATION = new Animation("alphaAnimation", "alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    constructor(scene: Scene) {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("StarMapUI", true, scene);
        this.scene = scene;

        this.namePlate = new StackPanel();
        this.namePlate.width = "300px";
        //this.namePlate.height = "150px";
        this.namePlate.color = "white";
        this.namePlate.background = "black";
        this.namePlate.linkOffsetY = -200;
        this.namePlate.zIndex = 6;

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

        this.hoveredSystemRing = new Image("hoverSystemRing", hoveredCircle);
        this.hoveredSystemRing.fixedRatio = 1;
        this.hoveredSystemRing.width = 0.2;
        this.hoveredSystemRing.alpha = 0.8;
        this.hoveredSystemRing.zIndex = 4;

        this.currentSystemRing = new Image("currentSystemRing", selectedCircle);
        this.currentSystemRing.fixedRatio = 1;
        this.currentSystemRing.width = 0.2;
        this.currentSystemRing.alpha = 1;
        this.currentSystemRing.zIndex = 5;

        StarMapUI.ALPHA_ANIMATION.setKeys([
            { frame: 0, value: 0.0 },
            { frame: 60, value: 0.8 }
        ]);

        this.hoveredSystemRing.animations = [StarMapUI.ALPHA_ANIMATION];
    }

    update() {
        if (this.namePlate.linkedMesh === null) this.gui.removeControl(this.namePlate);
        if (this.hoveredSystemRing.linkedMesh !== null && this.hoveredSystemRing.linkedMesh !== undefined) {
            const distance = this.hoveredSystemRing.linkedMesh.getAbsolutePosition().length();
            const scale = this.hoveredSystemRing.linkedMesh.scaling.x / distance;
            this.hoveredSystemRing.scaleX = scale;
            this.hoveredSystemRing.scaleY = scale;
        }
        if (this.currentSystemRing.linkedMesh !== null && this.currentSystemRing.linkedMesh !== undefined) {
            const distance = this.currentSystemRing.linkedMesh.getAbsolutePosition().length();
            const scale = Math.max(0.5, this.currentSystemRing.linkedMesh.scaling.x / distance);
            this.currentSystemRing.scaleX = scale;
            this.currentSystemRing.scaleY = scale;
        }
    }

    attachUIToMesh(mesh: AbstractMesh) {
        this.gui._linkedControls = [];
        if (this.gui._linkedControls.length === 0) this.gui.addControl(this.namePlate);

        this.namePlate.linkWithMesh(mesh);


        //FIXME: this should not be here, probably a BabylonJS bug
        this.currentSystemRing.linkWithMesh(this.currentSystemRing.linkedMesh);
    }

    setHoveredStarSystemMesh(mesh: AbstractMesh | null) {
        if (mesh !== null) {
            this.scene.beginAnimation(this.hoveredSystemRing, 0, 60, false, 2.0);
            this.gui.addControl(this.hoveredSystemRing);
        } else {
            this.gui.removeControl(this.hoveredSystemRing);
        }
        this.hoveredSystemRing.linkWithMesh(mesh);
    }

    setCurrentStarSystemMesh(mesh: AbstractMesh | null) {
        if(mesh !== null) this.gui.addControl(this.currentSystemRing);
        this.currentSystemRing.linkWithMesh(mesh);
    }

    detachUIFromMesh() {
        this.namePlate.linkWithMesh(null);
        this.gui.removeControl(this.namePlate);
    }

    getCurrentPickedMesh() {
        return this.namePlate.linkedMesh;
    }

    getCurrentHoveredMesh() {
        return this.hoveredSystemRing.linkedMesh;
    }

    setUIText(text: string) {
        this.nameLabel.text = text;
    }
}
