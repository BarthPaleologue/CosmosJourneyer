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

import { ClusteredLightContainer } from "@babylonjs/core/Lights/Clustered/clusteredLightContainer";
import type { Light } from "@babylonjs/core/Lights/light";
import type { Scene } from "@babylonjs/core/scene";

import type { ClusteredLightingRegion } from "@/frontend/universe/architecture/clusteredLightingRegion";

export class ClusteredLightingSystem {
    private readonly container: ClusteredLightContainer;

    private readonly regions = new Set<ClusteredLightingRegion>();

    public constructor(scene: Scene) {
        this.container = new ClusteredLightContainer("globalClusteredLights", [], scene);
    }

    public registerRegion(region: ClusteredLightingRegion): void {
        if (this.regions.has(region)) {
            return;
        }

        this.regions.add(region);
        for (const light of region.getLights()) {
            this.activateLight(light);
        }
    }

    public unregisterRegion(region: ClusteredLightingRegion): void {
        if (!this.regions.delete(region)) {
            return;
        }

        for (const light of region.getLights()) {
            this.deactivateLight(light);
        }
    }

    public dispose(): void {
        for (const region of [...this.regions]) {
            this.unregisterRegion(region);
        }

        this.container.dispose();
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
