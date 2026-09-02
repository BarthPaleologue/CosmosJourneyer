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

import type { Camera } from "@babylonjs/core/Cameras/camera";
import { Matrix } from "@babylonjs/core/Maths/math";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { TFunction } from "i18next";

import { getProjectedDiameter01 } from "@/frontend/helpers/isObjectVisibleOnScreen";
import {
    getTargetCursorAppearance,
    getTargetDisplayName,
    getTargetTypeName,
} from "@/frontend/presentation/targetPresentation";

import { smoothstep } from "@/utils/math";
import { parseDistance, parseSecondsRough } from "@/utils/strings/parseToStrings";

import type { Target } from "../../gameplay/targetable";

export class ObjectTargetCursor {
    readonly htmlRoot: HTMLDivElement;

    readonly cursor: HTMLDivElement;

    readonly textBlock: HTMLDivElement;
    readonly nameText: HTMLParagraphElement;
    readonly typeText: HTMLParagraphElement;
    readonly distanceText: HTMLParagraphElement;
    readonly etaText: HTMLParagraphElement;

    readonly object: Target;
    private readonly t: TFunction;

    private lastDistance = 0;

    readonly minDistance: number;
    readonly maxDistance: number;

    readonly minSize: number;
    readonly maxSize: number;

    private alpha = 1.0;

    readonly screenCoordinates: Vector3 = Vector3.Zero();

    private isTarget = false;

    private isPinned = false;

    private isInformationEnabled = false;

    private isOnScreen = false;

    constructor(object: Target, t: TFunction) {
        this.t = t;
        const name = getTargetDisplayName(object, t);
        const appearance = getTargetCursorAppearance(object);
        this.htmlRoot = document.createElement("div");
        this.htmlRoot.classList.add("targetCursorRoot");
        this.htmlRoot.dataset["name"] = name + " Target Cursor Root";

        this.cursor = document.createElement("div");
        this.cursor.classList.add("targetCursor");

        this.cursor.classList.add(appearance.shape);
        this.minSize = appearance.minSize;
        this.maxSize = appearance.maxSize;

        this.textBlock = document.createElement("div");
        this.textBlock.classList.add("targetCursorText");

        this.nameText = document.createElement("p");
        this.nameText.classList.add("targetCursorName");
        this.nameText.textContent = name;

        this.typeText = document.createElement("p");
        this.typeText.classList.add("targetCursorType");
        this.typeText.textContent = getTargetTypeName(object, t);

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

        this.minDistance = appearance.minDistance;
        this.maxDistance = appearance.maxDistance;
    }

    setTarget(isTarget: boolean): void {
        this.isTarget = isTarget;
        this.cursor.classList.toggle("target", isTarget);
    }

    setPinned(isPinned: boolean): void {
        this.isPinned = isPinned;
    }

    setInformationEnabled(enabled: boolean): void {
        this.isInformationEnabled = enabled;
    }

    update(camera: Camera): void {
        this.object.getTransform().computeWorldMatrix(true);
        const objectRay = this.object.getTransform().getAbsolutePosition().subtract(camera.globalPosition);
        const distance = objectRay.length();
        const cameraToObject = objectRay.scale(1 / distance);
        const cameraForward = camera.getDirection(Vector3.Forward(camera.getScene().useRightHandedSystem));

        this.isOnScreen = Vector3.Dot(cameraToObject, cameraForward) > 0;

        if (this.isOnScreen && this.alpha > 0) {
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

        const screenSize = getProjectedDiameter01(
            this.object.getTransform().getAbsolutePosition(),
            this.object.getBoundingRadius(),
            camera.globalPosition,
            camera.fov,
        );

        let size = 100 * (screenSize * 1.3);
        if (this.minSize > 0) {
            size = Math.max(size, this.minSize);
        }
        if (this.maxSize > 0) {
            size = Math.min(size, this.maxSize);
        }
        this.htmlRoot.style.setProperty("--dim", `${size}vh`);

        this.alpha = 1.0;
        if (this.minDistance > 0) {
            this.alpha *= smoothstep(this.minDistance * 0.5, this.minDistance, distance);
        }
        if (this.maxDistance > 0 && !this.isTarget && !this.isPinned) {
            this.alpha *= smoothstep(this.maxDistance * 1.5, this.maxDistance, distance);
        }

        this.cursor.style.opacity = `${Math.min(this.alpha, this.isTarget ? 1 : 0.5)}`;
        this.textBlock.style.opacity = this.isInformationEnabled ? `${this.alpha}` : "0.0";

        const isTextVisible = this.isOnScreen && this.isInformationEnabled && this.alpha > 0;
        if (isTextVisible) {
            this.distanceText.textContent = parseDistance(distance, this.t);

            const nbSeconds = distance / speed;
            this.etaText.textContent = "ETA: " + (speed > 0 ? parseSecondsRough(nbSeconds, this.t) : "∞");
        }

        this.lastDistance = distance;
    }

    isVisible(): boolean {
        return this.alpha > 0 && this.isOnScreen;
    }

    dispose(): void {
        this.htmlRoot.remove();
    }
}
