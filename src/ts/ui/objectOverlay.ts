import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { AbstractObject } from "../bodies/abstractObject";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Image } from "@babylonjs/gui/2D/controls/image";
import cursorImage from "../../asset/textures/hoveredCircle.png";
import { parseDistance, parseSeconds } from "../utils/parseToStrings";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { getAngularSize } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { LOCAL_DIRECTION } from "../uberCore/localDirections";

export class ObjectOverlay {
    readonly textRoot: StackPanel;
    readonly cursor: Image;
    readonly namePlate: TextBlock;
    readonly typeText: TextBlock;
    readonly distanceText: TextBlock;
    readonly etaText: TextBlock;
    readonly object: AbstractObject;

    private lastDistance: number = 0;

    constructor(object: AbstractObject) {
        this.object = object;

        this.textRoot = new StackPanel(object.name + "OverlayTextRoot");
        this.textRoot.width = "150px";
        this.textRoot.height = "130px";
        this.textRoot.background = "transparent";
        this.textRoot.zIndex = 6;
        this.textRoot.alpha = 0.95;

        this.namePlate = new TextBlock(object.name + "OverlayNamePlate");
        this.namePlate.text = object.name;
        this.namePlate.color = "white";
        this.namePlate.zIndex = 6;
        this.namePlate.height = "50px";
        this.namePlate.fontSize = 20;
        this.namePlate.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.namePlate.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.textRoot.addControl(this.namePlate);

        this.typeText = new TextBlock(object.name + "OverlayTypeText");
        this.typeText.text = object.getTypeName();
        this.typeText.color = "white";
        this.typeText.zIndex = 6;
        this.typeText.height = "20px";
        this.typeText.fontSize = 16;
        this.typeText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.typeText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.textRoot.addControl(this.typeText);

        this.distanceText = new TextBlock(object.name + "OverlayDistanceText");
        this.distanceText.color = "white";
        this.distanceText.zIndex = 6;
        this.distanceText.height = "20px";
        this.distanceText.fontSize = 16;
        this.distanceText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.distanceText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.textRoot.addControl(this.distanceText);

        this.etaText = new TextBlock(object.name + "OverlayEtaText");
        this.etaText.color = "white";
        this.etaText.zIndex = 6;
        this.etaText.height = "20px";
        this.etaText.fontSize = 16;
        this.etaText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.etaText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.textRoot.addControl(this.etaText);

        this.cursor = new Image(object.name + "Cursor", cursorImage);
        this.cursor.fixedRatio = 1;
        this.cursor.width = 1;
        this.cursor.alpha = 0.8;
        this.cursor.zIndex = 4;
    }

    init() {
        this.textRoot.linkWithMesh(this.object.getTransform());
        this.cursor.linkWithMesh(this.object.getTransform());
    }

    update(camera: Camera, target: AbstractObject | null) {
        const viewRay = camera.getDirection(LOCAL_DIRECTION.BACKWARD);
        const objectRay = this.object.getTransform().getAbsolutePosition().subtract(camera.globalPosition);
        const distance = objectRay.length();
        const deltaDistance = this.lastDistance - distance;
        const speed = deltaDistance != 0 ? deltaDistance / (camera.getScene().getEngine().getDeltaTime() / 1000) : 0;
        objectRay.scaleInPlace(1 / distance);

        if (Vector3.Dot(viewRay, objectRay) < 0) {
            this.cursor.isVisible = false;
            this.textRoot.isVisible = false;
            return;
        }

        this.cursor.isVisible = true;
        this.textRoot.isVisible = this.object === target;

        const angularSize = getAngularSize(this.object.getTransform().getAbsolutePosition(), this.object.getBoundingRadius(), camera.globalPosition);
        const screenRatio = angularSize / camera.fov;

        const scale = Math.max(0.02, 0.03 * Math.pow(this.object.getBoundingRadius() / 1e6, 0.2));
        this.cursor.scaleX = Math.max(scale, screenRatio);
        this.cursor.scaleY = Math.max(scale, screenRatio);

        const alphaCursor = 100 * Math.max(scale - screenRatio, 0.0);
        this.cursor.alpha = Math.min(alphaCursor, 0.5);

        const alphaText = Math.max(0, distance / (3 * this.object.getBoundingRadius()) - 1.0);
        this.textRoot.alpha = alphaText;

        this.textRoot.linkOffsetXInPixels = 0.5 * Math.max(scale, screenRatio) * window.innerWidth + 75 + 20;

        this.distanceText.text = parseDistance(distance);

        const nbSeconds = distance / speed;
        this.etaText.text = speed > 0 && nbSeconds < 60 * 60 * 24 ? parseSeconds(nbSeconds) : "∞";

        this.lastDistance = distance;
    }

    dispose() {
        this.textRoot.dispose();
        this.cursor.dispose();
    }
}
