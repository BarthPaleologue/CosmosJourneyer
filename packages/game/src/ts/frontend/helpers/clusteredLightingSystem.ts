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
import { ClusteredLightContainer } from "@babylonjs/core/Lights/Clustered/clusteredLightContainer";
import type { Light } from "@babylonjs/core/Lights/light";
import type { Scene } from "@babylonjs/core/scene";

import type { ClusteredLightingRegion } from "@/frontend/presentation/clusteredLightingRegion";

import { DefaultMinProjectedDiameter, getProjectedDiameter01 } from "./isObjectVisibleOnScreen";

type ClusteredLightingRegionState = {
    isActive: boolean;
};

const ACTIVATION_THRESHOLD = DefaultMinProjectedDiameter;
// Keep lights active slightly beyond the visual culling threshold to prevent flicker around the boundary.
const DEACTIVATION_THRESHOLD = DefaultMinProjectedDiameter * 0.8;

export class ClusteredLightingSystem {
    private readonly container: ClusteredLightContainer;

    private readonly regions = new Map<ClusteredLightingRegion, ClusteredLightingRegionState>();

    public constructor(scene: Scene) {
        this.container = new ClusteredLightContainer("globalClusteredLights", [], scene);
    }

    public registerRegion(region: ClusteredLightingRegion): void {
        if (this.regions.has(region)) {
            return;
        }

        this.regions.set(region, { isActive: false });
        for (const light of region.getLights()) {
            light.setEnabled(false);
        }
    }

    public unregisterRegion(region: ClusteredLightingRegion): void {
        const state = this.regions.get(region);
        if (state === undefined) {
            return;
        }

        if (state.isActive) {
            this.deactivateRegion(region, state);
        }
        this.regions.delete(region);
    }

    public update(camera: Camera): void {
        for (const [region, state] of this.regions) {
            const projectedDiameter = getProjectedDiameter01(
                region.getTransform().getAbsolutePosition(),
                region.getBoundingRadius(),
                camera.globalPosition,
                camera.fov,
            );

            if (!state.isActive) {
                if (projectedDiameter >= ACTIVATION_THRESHOLD) {
                    this.activateRegion(region, state);
                }
                continue;
            }

            if (projectedDiameter < DEACTIVATION_THRESHOLD) {
                this.deactivateRegion(region, state);
            }
        }
    }

    public dispose(): void {
        for (const region of [...this.regions.keys()]) {
            this.unregisterRegion(region);
        }

        this.container.dispose();
    }

    private activateRegion(region: ClusteredLightingRegion, state: ClusteredLightingRegionState): void {
        if (state.isActive) {
            return;
        }

        for (const light of region.getLights()) {
            this.activateLight(light);
        }
        state.isActive = true;
    }

    private deactivateRegion(region: ClusteredLightingRegion, state: ClusteredLightingRegionState): void {
        if (!state.isActive) {
            return;
        }

        for (const light of region.getLights()) {
            this.deactivateLight(light);
        }
        state.isActive = false;
    }

    private activateLight(light: Light): void {
        this.container.addLight(light);
        light.setEnabled(true);
    }

    private deactivateLight(light: Light): void {
        light.setEnabled(false);
        this.container.removeLight(light);
    }
}
