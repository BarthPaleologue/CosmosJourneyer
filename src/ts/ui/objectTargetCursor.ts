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

import { parseDistance, parseSeconds } from "../utils/parseToStrings";
import { getAngularSize } from "../utils/isObjectVisibleOnScreen";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { Transformable } from "../architecture/transformable";
import { BoundingSphere } from "../architecture/boundingSphere";
import { TypedObject } from "../architecture/typedObject";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Matrix } from "@babylonjs/core/Maths/math";
import { smoothstep } from "../utils/smoothstep";

export const enum ObjectTargetCursorType {
    CELESTIAL_BODY,
    FACILITY,
    ANOMALY
}

export class ObjectTargetCursor {
    readonly htmlRoot: HTMLDivElement;
    
    readonly cursor: HTMLDivElement;

    readonly textBlock: HTMLDivElement;
    readonly nameText: HTMLParagraphElement;
    readonly typeText: HTMLParagraphElement;
    readonly distanceText: HTMLParagraphElement;
    readonly etaText: HTMLParagraphElement;

    readonly object: Transformable & BoundingSphere & TypedObject;

    private lastDistance = 0;

    static readonly WIDTH = 300;

    readonly minDistance: number;
    readonly maxDistance: number;

    readonly minSize: number;

    private alpha = 1.0;

    readonly screenCoordinates: Vector3 = Vector3.Zero();

    private isTarget = false;

    constructor(object: Transformable & BoundingSphere & TypedObject, iconType: ObjectTargetCursorType, minDistance: number, maxDistance: number) {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("targetCursorRoot");
        this.htmlRoot.dataset.name = object.getTransform().name + " Target Cursor Root";

        this.cursor = document.createElement("div");
        this.cursor.classList.add("targetCursor");

        switch (iconType) {
            case ObjectTargetCursorType.CELESTIAL_BODY:
                this.cursor.classList.add("rounded");
                this.minSize = 5;
                break;
            case ObjectTargetCursorType.FACILITY:
                this.cursor.classList.add("rotated");
                this.minSize = 2;
                break;
            case ObjectTargetCursorType.ANOMALY:
                this.cursor.classList.add("rounded");
                this.minSize = 2;
                break;
        }

        this.textBlock = document.createElement("div");
        this.textBlock.classList.add("targetCursorText");

        this.nameText = document.createElement("p");
        this.nameText.classList.add("targetCursorName");
        this.nameText.textContent = object.getTransform().name;

        this.typeText = document.createElement("p");
        this.typeText.classList.add("targetCursorType");
        this.typeText.textContent = object.getTypeName();

        this.distanceText = document.createElement("p");
        this.distanceText.classList.add("targetCursorDistance");
        this.distanceText.textContent = "0 km";

        this.etaText = document.createElement("p");
        this.etaText.classList.add("targetCursorEta");
        this.etaText.textContent = "∞";

        document.body.appendChild(this.htmlRoot);

        this.htmlRoot.appendChild(this.cursor);

        this.htmlRoot.appendChild(this.textBlock);

        this.textBlock.appendChild(this.nameText);
        this.textBlock.appendChild(this.typeText);
        this.textBlock.appendChild(this.distanceText);
        this.textBlock.appendChild(this.etaText);

        this.object = object;

        this.minDistance = minDistance;
        this.maxDistance = maxDistance;
    }

    setTarget(isTarget: boolean) {
        this.isTarget = isTarget;
    }

    update(camera: Camera) {
        const objectRay = this.object.getTransform().getAbsolutePosition().subtract(camera.globalPosition);
        const distance = objectRay.length();
        const cameraToObject = objectRay.scale(1 / distance);
        const cameraForward = camera.getDirection(Vector3.Forward(camera.getScene().useRightHandedSystem));

        if (Vector3.Dot(cameraToObject, cameraForward) > 0) {
            Vector3.ProjectToRef(this.object.getTransform().getAbsolutePosition(), Matrix.IdentityReadOnly, camera.getTransformationMatrix(), camera.viewport, this.screenCoordinates);

            this.htmlRoot.classList.remove("hidden");
            this.htmlRoot.style.left = `${this.screenCoordinates.x * 100}vw`;
            this.htmlRoot.style.top = `${this.screenCoordinates.y * 100}vh`;
        } else {
            this.htmlRoot.classList.add("hidden");
        }

        const deltaDistance = this.lastDistance - distance;
        const speed = deltaDistance !== 0 ? deltaDistance / (camera.getScene().getEngine().getDeltaTime() / 1000) : 0;
        objectRay.scaleInPlace(1 / distance);

        const angularSize = getAngularSize(this.object.getTransform().getAbsolutePosition(), this.object.getBoundingRadius(), camera.globalPosition);
        const screenRatio = angularSize / camera.fov;

        this.htmlRoot.style.setProperty("--dim", Math.max(100 * (screenRatio * 1.3), this.minSize) + "vh");

        this.alpha = 1.0;
        if(this.minDistance > 0) this.alpha *= smoothstep(this.minDistance * 0.5, this.minDistance, distance);
        if(this.maxDistance > 0 && !this.isTarget) this.alpha *= smoothstep(this.maxDistance * 1.5, this.maxDistance, distance);

        this.cursor.style.opacity = `${Math.min(this.alpha, 0.5)}`;
        this.textBlock.style.opacity = this.isTarget ? `${this.alpha}` : "0.0";

        this.distanceText.innerText = parseDistance(distance);

        const nbSeconds = distance / speed;
        this.etaText.innerText = "ETA: " + (speed > 0 ? parseSeconds(nbSeconds) : "∞");

        this.lastDistance = distance;
    }

    isVisible() {
        return this.alpha > 0 && this.screenCoordinates.z > 0;
    }

    dispose() {
        this.htmlRoot.remove();
    }
}
