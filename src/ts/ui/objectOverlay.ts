import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { AbstractObject } from "../view/bodies/abstractObject";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Image } from "@babylonjs/gui/2D/controls/image";
import cursorImage from "../../asset/textures/hoveredCircle.png";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

export class ObjectOverlay {
    readonly textRoot: StackPanel;
    readonly cursor: Image;
    readonly namePlate: TextBlock;
    readonly object: AbstractObject;

    constructor(object: AbstractObject) {
        this.object = object;

        this.textRoot = new StackPanel(object.name + "OverlayTextRoot");
        this.textRoot.width = "150px";
        this.textRoot.height = "70px";
        this.textRoot.background = "darkred";
        this.textRoot.linkOffsetX = 130;
        this.textRoot.zIndex = 6;
        this.textRoot.alpha = 0.95;

        this.namePlate = new TextBlock(object.name + "OverlayNamePlate");
        this.namePlate.text = object.name;
        this.namePlate.color = "white";
        this.namePlate.zIndex = 6;
        this.namePlate.height = "50px";
        this.namePlate.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.textRoot.addControl(this.namePlate);

        this.cursor = new Image(object.name + "Cursor", cursorImage);
        this.cursor.fixedRatio = 1;
        this.cursor.width = 1;
        this.cursor.alpha = 0.8;
        this.cursor.zIndex = 4;
    }

    init() {
        console.log(this.object.getTransform());
        this.textRoot.linkWithMesh(this.object.getTransform());
        this.cursor.linkWithMesh(this.object.getTransform());
    }

    update(cameraPosition: Vector3) {
        if (this.cursor.linkedMesh === null) return;
        const distance = this.cursor.linkedMesh.getAbsolutePosition().subtract(cameraPosition).length();
        const scale = Math.max(0.02, 0.03 * Math.pow(this.object.getBoundingRadius() / 1e6, 0.2));
        this.cursor.scaleX = scale;
        this.cursor.scaleY = scale;

        const alpha = 1e-3 * distance / this.object.getBoundingRadius();
        this.textRoot.alpha = alpha;
        this.cursor.alpha = Math.min(alpha, 0.5);
    }
}
