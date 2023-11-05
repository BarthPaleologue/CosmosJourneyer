import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { AbstractObject } from "../view/bodies/abstractObject";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";

export class ObjectOverlay {
    readonly textRoot: StackPanel;
    readonly namePlate: TextBlock;
    readonly object: AbstractObject;

    constructor(object: AbstractObject) {
        this.object = object;

        this.textRoot = new StackPanel();
        this.textRoot.width = "200px";
        this.textRoot.height = "70px";
        this.textRoot.background = "darkred";
        this.textRoot.linkOffsetX = 100;
        this.textRoot.zIndex = 6;
        this.textRoot.alpha = 0.95;

        this.namePlate = new TextBlock();
        this.namePlate.text = object.name;
        this.namePlate.color = "white";
        this.namePlate.zIndex = 6;
        this.textRoot.addControl(this.namePlate);
        //this.namePlate.setPadding(15, 15, 10, 15);
    }

    init() {
        this.textRoot.linkWithMesh(this.object.getTransform());
    }
}
