//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//
//  You should have received a copy of the GNU General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

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
import { Settings } from "../settings";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import i18n from "../i18n";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

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
    readonly uiCamera: FreeCamera;

    static ALPHA_ANIMATION = new Animation("alphaAnimation", "alpha", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CYCLE);

    private _isHovered = false;

    constructor(engine: AbstractEngine) {
        this.scene = new Scene(engine);
        this.scene.useRightHandedSystem = true;
        this.scene.autoClear = false;

        this.uiCamera = new FreeCamera("UiCamera", Vector3.Zero(), this.scene);

        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("StarMapUI", true, this.scene);

        this.systemUI = new StackPanel();
        this.systemUI.width = "300px";
        this.systemUI.height = "220px";
        this.systemUI.color = "white";
        this.systemUI.background = "black";
        this.systemUI.linkOffsetY = -200;
        this.systemUI.zIndex = 6;
        this.systemUI.alpha = 0.95;

        this.systemUI.onPointerEnterObservable.add(() => {
            this._isHovered = true;
        });

        this.systemUI.onPointerOutObservable.add(() => {
            this._isHovered = false;
        });

        this.namePlate = new TextBlock();
        this.namePlate.text = "";
        this.namePlate.fontSize = 24;
        this.namePlate.height = "50px";
        this.namePlate.fontFamily = Settings.MAIN_FONT;
        this.namePlate.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.namePlate.setPadding(15, 15, 10, 15);

        this.descriptionPanel = new TextBlock();
        this.descriptionPanel.height = "130px";
        this.descriptionPanel.lineSpacing = 4.0;
        this.descriptionPanel.fontFamily = Settings.MAIN_FONT;
        this.descriptionPanel.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.descriptionPanel.setPadding(0, 15, 10, 15);

        this.warpButton = Button.CreateSimpleButton("warpButton", i18n.t("starMap:setAsDestination"));
        //this.warpButton.width = "100px";
        this.warpButton.height = "40px";
        this.warpButton.background = "midnightblue";
        this.warpButton.fontWeight = "bold";
        this.warpButton.fontFamily = Settings.MAIN_FONT;
        this.warpButton.isPointerBlocker = false;
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

    isHovered() {
        return this._isHovered;
    }

    update(playerPosition: Vector3) {
        if (this.systemUI.linkedMesh === null || this.systemUI.linkedMesh === undefined) this.gui.removeControl(this.systemUI);
        else {
            this.systemUI.linkOffsetY = -150 - 50 / this.systemUI.linkedMesh.getAbsolutePosition().length();
        }
        if (this.hoveredSystemRing.linkedMesh !== null && this.hoveredSystemRing.linkedMesh !== undefined) {
            const distance = this.hoveredSystemRing.linkedMesh.getAbsolutePosition().subtract(playerPosition).length();
            const scale = this.hoveredSystemRing.linkedMesh.scaling.x / distance;
            this.hoveredSystemRing.scaleX = scale;
            this.hoveredSystemRing.scaleY = scale;
        }
        if (this.selectedSystemRing.linkedMesh !== null && this.selectedSystemRing.linkedMesh !== undefined) {
            const distance = this.selectedSystemRing.linkedMesh.getAbsolutePosition().subtract(playerPosition).length();
            const scale = Math.max(0.3, this.selectedSystemRing.linkedMesh.scaling.x / distance);
            this.selectedSystemRing.scaleX = scale;
            this.selectedSystemRing.scaleY = scale;
        }
        if (this.currentSystemRing.linkedMesh !== null && this.currentSystemRing.linkedMesh !== undefined) {
            const distance = this.currentSystemRing.linkedMesh.getAbsolutePosition().subtract(playerPosition).length();
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
