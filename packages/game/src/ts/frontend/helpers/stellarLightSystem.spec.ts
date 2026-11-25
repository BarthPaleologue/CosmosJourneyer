//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2026 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
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

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { StellarLightSystem } from "./stellarLightSystem";

vi.mock("@babylonjs/core/Lights/Shadows/cascadedShadowGenerator", () => ({
    CascadedShadowGenerator: class {
        static readonly QUALITY_HIGH = 0;
        readonly dispose = vi.fn();
    },
}));

describe("StellarLightSystem lens flare sources", () => {
    let engine: NullEngine;
    let scene: Scene;
    let stellarLightSystem: StellarLightSystem;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        stellarLightSystem = new StellarLightSystem(scene);
    });

    afterEach(() => {
        stellarLightSystem.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("exposes the bounding radius and color of every registered source", () => {
        const first = new TransformNode("first", scene);
        const second = new TransformNode("second", scene);
        const warm = new Color3(1, 0.75, 0.5);
        const cool = new Color3(0.5, 0.75, 1);

        stellarLightSystem.registerStellarObject(first, warm, 3);
        stellarLightSystem.registerStellarObject(second, cool, 5);

        expect(stellarLightSystem.getLights()).toHaveLength(2);
        expect(stellarLightSystem.getLensFlareSources()).toEqual([
            { transform: first, boundingRadius: 3, color: warm },
            { transform: second, boundingRadius: 5, color: cool },
        ]);
    });
});
