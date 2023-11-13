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
import { Camera } from "@babylonjs/core/Cameras/camera";

export class StarMapUI {
    readonly gui: AdvancedDynamicTexture;
    readonly systemUI: StackPanel;
    readonly namePlate: TextBlock;
    readonly descriptionPanel: TextBlock;
    readonly warpButton: Button;

    readonly hoveredSystemRing: Image;
    readonly selectedSystemRing: Image;
    readonly currentSystemRing: Image;

    readonly scene: Scene;

    static ALPHA_ANIMATION = new Animation("alphaAnimation", "alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    constructor(scene: Scene) {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("StarMapUI", true, scene);
        this.scene = scene;

        this.systemUI = new StackPanel();
        this.systemUI.width = "300px";
        this.systemUI.height = "220px";
        this.systemUI.color = "white";
        this.systemUI.background = "black";
        this.systemUI.linkOffsetY = -200;
        this.systemUI.zIndex = 6;
        this.systemUI.alpha = 0.95;

        this.namePlate = new TextBlock();
        this.namePlate.text = "Vesperia Gamma";
        this.namePlate.fontSize = 24;
        this.namePlate.height = "50px";
        this.namePlate.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.namePlate.setPadding(15, 15, 10, 15);

        this.descriptionPanel = new TextBlock();
        this.descriptionPanel.height = "130px";
        this.descriptionPanel.lineSpacing = 4.0;
        this.descriptionPanel.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.descriptionPanel.setPadding(0, 15, 10, 15);

        this.warpButton = Button.CreateSimpleButton("warpButton", "Engage Warp Drive");
        //this.warpButton.width = "100px";
        this.warpButton.height = "40px";
        this.warpButton.background = "midnightblue";
        this.warpButton.fontWeight = "bold";
        //this.warpButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;

        this.systemUI.addControl(this.namePlate);
        this.systemUI.addControl(this.descriptionPanel);
        this.systemUI.addControl(this.warpButton);

        this.hoveredSystemRing = new Image("hoverSystemRing", hoveredCircle);
        this.hoveredSystemRing.fixedRatio = 1;
        this.hoveredSystemRing.width = 0.2;
        this.hoveredSystemRing.alpha = 0.8;
        this.hoveredSystemRing.zIndex = 4;

        this.selectedSystemRing = new Image("selectedSystemRing", hoveredCircle);
        this.selectedSystemRing.fixedRatio = 1;
        this.selectedSystemRing.width = 0.2;
        this.selectedSystemRing.alpha = 0.8;
        this.selectedSystemRing.zIndex = 4;

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

    update(activeCamera: Camera) {
        if (this.systemUI.linkedMesh === null || this.systemUI.linkedMesh === undefined) this.gui.removeControl(this.systemUI);
        else {
            this.systemUI.linkOffsetY = -150 - 50 / this.systemUI.linkedMesh.getAbsolutePosition().length();
        }
        if (this.hoveredSystemRing.linkedMesh !== null && this.hoveredSystemRing.linkedMesh !== undefined) {
            const distance = this.hoveredSystemRing.linkedMesh.getAbsolutePosition().subtract(activeCamera.globalPosition).length();
            const scale = this.hoveredSystemRing.linkedMesh.scaling.x / distance;
            this.hoveredSystemRing.scaleX = scale;
            this.hoveredSystemRing.scaleY = scale;
        }
        if (this.selectedSystemRing.linkedMesh !== null && this.selectedSystemRing.linkedMesh !== undefined) {
            const distance = this.selectedSystemRing.linkedMesh.getAbsolutePosition().subtract(activeCamera.globalPosition).length();
            const scale = Math.max(0.3, this.selectedSystemRing.linkedMesh.scaling.x / distance);
            this.selectedSystemRing.scaleX = scale;
            this.selectedSystemRing.scaleY = scale;
        }
        if (this.currentSystemRing.linkedMesh !== null && this.currentSystemRing.linkedMesh !== undefined) {
            const distance = this.currentSystemRing.linkedMesh.getAbsolutePosition().subtract(activeCamera.globalPosition).length();
            const scale = Math.max(0.3, this.currentSystemRing.linkedMesh.scaling.x / distance);
            this.currentSystemRing.scaleX = scale;
            this.currentSystemRing.scaleY = scale;
        }
    }

    attachUIToMesh(mesh: AbstractMesh) {
        this.gui._linkedControls = [];
        if (this.gui._linkedControls.length === 0) this.gui.addControl(this.systemUI);

        this.systemUI.linkWithMesh(mesh);

        this.gui.addControl(this.selectedSystemRing);
        this.selectedSystemRing.linkWithMesh(mesh);

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
        if (mesh !== null) this.gui.addControl(this.currentSystemRing);
        this.currentSystemRing.linkWithMesh(mesh);
    }

    detachUIFromMesh() {
        this.systemUI.linkWithMesh(null);
        this.gui.removeControl(this.systemUI);
    }

    getCurrentPickedMesh() {
        return this.systemUI.linkedMesh;
    }

    getCurrentHoveredMesh() {
        return this.hoveredSystemRing.linkedMesh;
    }

    setSelectedSystem({ name, text }: { name: string; text: string }) {
        this.namePlate.text = name;
        this.descriptionPanel.text = text;
    }
}
