//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { TextBlock } from "@babylonjs/gui/2D/controls/textBlock";
import { StackPanel } from "@babylonjs/gui/2D/controls/stackPanel";
import { Image } from "@babylonjs/gui/2D/controls/image";
import { parseDistance, parseSeconds } from "../utils/parseToStrings";
import { getAngularSize } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { LocalDirection } from "../uberCore/localDirections";
import { Settings } from "../settings";
import { Transformable } from "../architecture/transformable";
import { BoundingSphere } from "../architecture/boundingSphere";
import { TypedObject } from "../architecture/typedObject";
import { Textures } from "../assets/textures";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";


export class ObjectOverlay {
    readonly textRoot: StackPanel;
    readonly cursor: Image;
    readonly namePlate: TextBlock;
    readonly typeText: TextBlock;
    readonly distanceText: TextBlock;
    readonly etaText: TextBlock;
    readonly object: Transformable & BoundingSphere & TypedObject;

    private lastDistance = 0;

    static readonly WIDTH = 300;

    /**
     * @see https://forum.babylonjs.com/t/how-to-render-gui-attached-to-objects-far-away/51271/2
     * @private
     */
    private readonly transformPlaceHolder: TransformNode;

    constructor(object: Transformable & BoundingSphere & TypedObject) {
        this.object = object;

        this.textRoot = new StackPanel(object.getTransform().name + "OverlayTextRoot");
        this.textRoot.width = `${ObjectOverlay.WIDTH}px`;
        this.textRoot.height = "130px";
        this.textRoot.background = "transparent";
        this.textRoot.zIndex = 6;
        this.textRoot.alpha = 0.95;

        this.namePlate = new TextBlock(object.getTransform().name + "OverlayNamePlate");
        this.namePlate.text = object.getTransform().name;
        this.namePlate.color = "white";
        this.namePlate.zIndex = 6;
        this.namePlate.height = "50px";
        this.namePlate.fontSize = 20;
        this.namePlate.fontFamily = Settings.MAIN_FONT;
        this.namePlate.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.namePlate.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.textRoot.addControl(this.namePlate);

        this.typeText = new TextBlock(object.getTransform().name + "OverlayTypeText");
        this.typeText.text = object.getTypeName();
        this.typeText.color = "white";
        this.typeText.zIndex = 6;
        this.typeText.height = "20px";
        this.typeText.fontSize = 16;
        this.typeText.fontFamily = Settings.MAIN_FONT;
        this.typeText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.typeText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.textRoot.addControl(this.typeText);

        this.distanceText = new TextBlock(object.getTransform().name + "OverlayDistanceText");
        this.distanceText.color = "white";
        this.distanceText.zIndex = 6;
        this.distanceText.height = "20px";
        this.distanceText.fontSize = 16;
        this.distanceText.fontFamily = Settings.MAIN_FONT;
        this.distanceText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.distanceText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.textRoot.addControl(this.distanceText);

        this.etaText = new TextBlock(object.getTransform().name + "OverlayEtaText");
        this.etaText.color = "white";
        this.etaText.zIndex = 6;
        this.etaText.height = "20px";
        this.etaText.fontSize = 16;
        this.etaText.fontFamily = Settings.MAIN_FONT;
        this.etaText.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_LEFT;
        this.etaText.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;
        this.textRoot.addControl(this.etaText);

        this.cursor = new Image("cursorImage", Textures.CURSOR_IMAGE_URL);
        this.cursor.fixedRatio = 1;
        this.cursor.width = 1;
        this.cursor.alpha = 0.8;
        this.cursor.zIndex = 4;

        this.transformPlaceHolder = new TransformNode(object.getTransform().name + "OverlayTransform", object.getTransform().getScene());
    }

    init() {
        this.textRoot.linkWithMesh(this.transformPlaceHolder);
        this.cursor.linkWithMesh(this.transformPlaceHolder);
    }

    update(camera: Camera, target: (Transformable & BoundingSphere & TypedObject) | null) {
        const cameraToObject = this.object.getTransform().getAbsolutePosition().subtract(camera.globalPosition).normalize();
        this.transformPlaceHolder.setAbsolutePosition(camera.globalPosition.add(cameraToObject.scale(10)));
        this.transformPlaceHolder.computeWorldMatrix(true);

        const viewRay = camera.getDirection(LocalDirection.BACKWARD);
        const objectRay = this.object.getTransform().getAbsolutePosition().subtract(camera.globalPosition);
        const distance = objectRay.length();
        const deltaDistance = this.lastDistance - distance;
        const speed = deltaDistance !== 0 ? deltaDistance / (camera.getScene().getEngine().getDeltaTime() / 1000) : 0;
        objectRay.scaleInPlace(1 / distance);

        /*if (Vector3.Dot(viewRay, objectRay) < 0) {
            this.cursor.isVisible = false;
            this.textRoot.isVisible = false;
            return;
        }*/

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

        this.textRoot.linkOffsetXInPixels = 0.5 * Math.max(scale, screenRatio) * window.innerWidth + ObjectOverlay.WIDTH / 2 + 20;

        this.distanceText.text = parseDistance(distance);

        const nbSeconds = distance / speed;
        this.etaText.text = speed > 0 ? parseSeconds(nbSeconds) : "∞";

        this.lastDistance = distance;
    }

    dispose() {
        this.textRoot.dispose();
        this.cursor.dispose();
        this.transformPlaceHolder.dispose();
    }
}
