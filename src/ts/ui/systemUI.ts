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

import { IDisposable, Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { ObjectTargetCursor, ObjectTargetCursorType } from "./objectTargetCursor";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Transformable } from "../architecture/transformable";
import { BoundingSphere } from "../architecture/boundingSphere";
import { TypedObject } from "../architecture/typedObject";
import { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";

export class SystemUI implements IDisposable {
    readonly scene: Scene;
    readonly camera: FreeCamera;
    readonly gui: AdvancedDynamicTexture;
    private objectOverlays: ObjectTargetCursor[] = [];

    private target: (Transformable & BoundingSphere & TypedObject) | null = null;

    constructor(engine: AbstractEngine) {
        this.scene = new Scene(engine);
        this.scene.useRightHandedSystem = true;
        this.scene.autoClear = false;

        this.camera = new FreeCamera("UiCamera", Vector3.Zero(), this.scene);

        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("SystemUI", true, this.scene);

        this.scene.onBeforeRenderObservable.add(() => {
            for (const overlay of this.objectOverlays) {
                overlay.update(this.camera);
            }
        });
    }

    public setEnabled(enabled: boolean) {
        this.gui.rootContainer.alpha = enabled ? 1 : 0;
    }

    public isEnabled() {
        return this.gui.rootContainer.alpha === 1;
    }

    public addObjectOverlay(object: Transformable & BoundingSphere & TypedObject, iconType: ObjectTargetCursorType, minDistance: number, maxDistance: number) {
        const overlay = new ObjectTargetCursor(object, iconType, minDistance, maxDistance);
        this.gui.addControl(overlay.textRoot);
        this.objectOverlays.push(overlay);
        overlay.init();
    }

    public getClosestToScreenCenterOrbitalObject(): (Transformable & BoundingSphere & TypedObject) | null {
        let nearest = null;
        let closestDistance = Number.POSITIVE_INFINITY;
        this.objectOverlays.forEach((overlay) => {
            if(!overlay.isVisible()) return;

            const screenCoordinates = overlay.screenCoordinates;
            const distance = screenCoordinates.subtract(new Vector3(0.5, 0.5, 0)).length();

            if (distance < closestDistance) {
                closestDistance = distance;
                nearest = overlay.object;
            }
        });

        return nearest;
    }

    public reset() {
        for (const overlay of this.objectOverlays) {
            overlay.dispose();
        }
        this.objectOverlays = [];
    }

    public setTarget(object: (Transformable & BoundingSphere & TypedObject) | null) {
        this.objectOverlays.forEach((overlay) => {
            overlay.setTarget(overlay.object === object);
        });

        if (this.target === object) {
            this.target = null;
            return;
        }
        this.target = object;
    }

    getTarget() {
        return this.target;
    }

    dispose() {
        this.reset();
        this.gui.dispose();
        this.scene.dispose();
    }
}
