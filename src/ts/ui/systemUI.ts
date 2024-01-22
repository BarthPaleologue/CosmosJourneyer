//  This file is part of CosmosJourneyer
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

import { Scene } from "@babylonjs/core/scene";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { ObjectOverlay } from "./objectOverlay";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { OrbitalObject } from "../architecture/orbitalObject";

export class SystemUI {
    readonly gui: AdvancedDynamicTexture;
    private objectOverlays: ObjectOverlay[] = [];

    private target: OrbitalObject | null = null;

    constructor(scene: Scene) {
        this.gui = AdvancedDynamicTexture.CreateFullscreenUI("SystemUI", true, scene);
    }

    public setEnabled(enabled: boolean) {
        this.gui.rootContainer.alpha = enabled ? 1 : 0;
    }

    public isEnabled() {
        return this.gui.rootContainer.alpha === 1;
    }

    public createObjectOverlays(objects: OrbitalObject[]) {
        this.removeObjectOverlays();

        for (const object of objects) {
            const overlay = new ObjectOverlay(object);
            this.gui.addControl(overlay.textRoot);
            this.gui.addControl(overlay.cursor);
            this.objectOverlays.push(overlay);
        }

        for (const overlay of this.objectOverlays) {
            overlay.init();
        }
    }

    public removeObjectOverlays() {
        for (const overlay of this.objectOverlays) {
            overlay.dispose();
        }
        this.objectOverlays = [];
    }

    public update(camera: Camera) {
        for (const overlay of this.objectOverlays) {
            overlay.update(camera, this.target);
        }
    }

    setTarget(object: OrbitalObject | null) {
        if (this.target === object) {
            this.target = null;
            return;
        }
        this.target = object;
    }
}
