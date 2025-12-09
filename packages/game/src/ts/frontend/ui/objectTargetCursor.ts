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

import { type Camera } from "@babylonjs/core/Cameras/camera";
import { Matrix } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

import { getAngularSize } from "@/frontend/helpers/isObjectVisibleOnScreen";

import { smoothstep } from "@/utils/math";
import { parseDistance, parseSecondsRough } from "@/utils/strings/parseToStrings";

import { type HasBoundingSphere } from "../universe/architecture/hasBoundingSphere";
import { ObjectTargetCursorType, type Targetable } from "../universe/architecture/targetable";
import { type Transformable } from "../universe/architecture/transformable";
import { type TypedObject } from "../universe/architecture/typedObject";

export class ObjectTargetCursor {
    readonly htmlRoot: HTMLDivElement;

    readonly cursor: HTMLDivElement;

    readonly textBlock: HTMLDivElement;
    readonly nameText: HTMLParagraphElement;
    readonly typeText: HTMLParagraphElement;
    readonly distanceText: HTMLParagraphElement;
    readonly etaText: HTMLParagraphElement;

    readonly object: Transformable & HasBoundingSphere & TypedObject;

    private lastDistance = 0;

    readonly minDistance: number;
    readonly maxDistance: number;

    readonly minSize: number;
    readonly maxSize: number;

    private alpha = 1.0;

    readonly screenCoordinates: Vector3 = Vector3.Zero();

    private isTarget = false;

    private isInformationEnabled = false;

    constructor(object: Targetable) {
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("targetCursorRoot");
        this.htmlRoot.dataset["name"] = object.getTransform().name + " Target Cursor Root";

        this.cursor = document.createElement("div");
        this.cursor.classList.add("targetCursor");

        switch (object.targetInfo.type) {
            case ObjectTargetCursorType.CELESTIAL_BODY:
                this.cursor.classList.add("rounded");
                this.minSize = 5;
                this.maxSize = 0;
                break;
            case ObjectTargetCursorType.FACILITY:
                this.cursor.classList.add("rotated");
                this.minSize = 3;
                this.maxSize = 0;
                break;
            case ObjectTargetCursorType.ANOMALY:
                this.cursor.classList.add("rounded");
                this.minSize = 2;
                this.maxSize = 0;
                break;
            case ObjectTargetCursorType.LANDING_PAD:
                this.cursor.classList.add("rotated");
                this.minSize = 1.5;
                this.maxSize = 1.5;
                break;
            case ObjectTargetCursorType.STAR_SYSTEM:
                this.cursor.classList.add("rounded");
                this.minSize = 1.5;
                this.maxSize = 1.5;
                break;
            case ObjectTargetCursorType.SPACESHIP:
                this.cursor.classList.add("rotated");
                this.minSize = 1.5;
                this.maxSize = 1.5;
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

        this.minDistance = object.targetInfo.minDistance;
        this.maxDistance = object.targetInfo.maxDistance;
    }

    setTarget(isTarget: boolean) {
        this.isTarget = isTarget;
        this.cursor.classList.toggle("target", isTarget);
    }

    setInformationEnabled(enabled: boolean) {
        this.isInformationEnabled = enabled;
    }

    update(camera: Camera) {
        this.object.getTransform().computeWorldMatrix(true);
        const objectRay = this.object.getTransform().getAbsolutePosition().subtract(camera.globalPosition);
        const distance = objectRay.length();
        const cameraToObject = objectRay.scale(1 / distance);
        const cameraForward = camera.getDirection(Vector3.Forward(camera.getScene().useRightHandedSystem));

        if (Vector3.Dot(cameraToObject, cameraForward) > 0 && this.alpha > 0) {
            Vector3.ProjectToRef(
                this.object.getTransform().getAbsolutePosition(),
                Matrix.IdentityReadOnly,
                camera.getTransformationMatrix(),
                camera.viewport,
                this.screenCoordinates,
            );

            this.htmlRoot.classList.remove("hidden");
            this.htmlRoot.style.left = `${this.screenCoordinates.x * camera.getEngine().getRenderWidth()}px`;
            this.htmlRoot.style.top = `${this.screenCoordinates.y * camera.getEngine().getRenderHeight()}px`;
        } else {
            this.htmlRoot.classList.add("hidden");
        }

        const deltaDistance = this.lastDistance - distance;
        const speed = deltaDistance !== 0 ? deltaDistance / (camera.getScene().getEngine().getDeltaTime() / 1000) : 0;
        objectRay.scaleInPlace(1 / distance);

        const angularSize = getAngularSize(
            this.object.getTransform().getAbsolutePosition(),
            this.object.getBoundingRadius(),
            camera.globalPosition,
        );
        const screenRatio = angularSize / camera.fov;

        let size = 100 * (screenRatio * 1.3);
        if (this.minSize > 0) size = Math.max(size, this.minSize);
        if (this.maxSize > 0) size = Math.min(size, this.maxSize);
        this.htmlRoot.style.setProperty("--dim", `${size}vh`);

        this.alpha = 1.0;
        if (this.minDistance > 0) this.alpha *= smoothstep(this.minDistance * 0.5, this.minDistance, distance);
        if (this.maxDistance > 0 && !this.isTarget)
            this.alpha *= smoothstep(this.maxDistance * 1.5, this.maxDistance, distance);

        this.cursor.style.opacity = `${Math.min(this.alpha, this.isTarget ? 1 : 0.5)}`;
        this.textBlock.style.opacity = this.isInformationEnabled ? `${this.alpha}` : "0.0";

        this.distanceText.innerText = parseDistance(distance);

        const nbSeconds = distance / speed;
        this.etaText.innerText = "ETA: " + (speed > 0 ? parseSecondsRough(nbSeconds) : "∞");

        this.lastDistance = distance;
    }

    isVisible() {
        return this.alpha > 0; // && this.screenCoordinates.z > 0;
    }

    dispose() {
        this.htmlRoot.remove();
    }
}
