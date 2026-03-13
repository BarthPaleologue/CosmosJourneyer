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

import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { ShaderMaterial } from "@babylonjs/core/Materials/shaderMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { afterAll, describe, expect, it } from "vitest";

import { ThrusterExhaust } from "./thrusterExhaust";

describe("ThrusterExhaust", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    scene.activeCamera = new FreeCamera("camera", new Vector3(0, 0, -10), scene);

    afterAll(() => {
        scene.dispose();
        engine.dispose();
    });

    it("is disabled at zero throttle and enabled otherwise", () => {
        const exhaust = new ThrusterExhaust("testExhaust", scene);

        expect(exhaust.getTransform().name).toBe("testExhaustTransform");
        expect(exhaust.isEnabled()).toBe(false);

        exhaust.setThrottle(0.5);
        expect(exhaust.isEnabled()).toBe(true);

        exhaust.setThrottle(-1);
        expect(exhaust.isEnabled()).toBe(false);

        exhaust.dispose();
    });

    it("passes cross-section extents as shader defines at construction", () => {
        const exhaust = new ThrusterExhaust("configuredExhaust", scene, {
            crossSection: {
                x: 0.21,
                z: 0.42,
            },
            rayMarchStepCount: 24,
        });

        const material = exhaust.getProxyMesh().material;
        expect(material).toBeInstanceOf(ShaderMaterial);
        expect((material as ShaderMaterial).options.defines).toEqual([
            "CROSS_SECTION_EXTENT_X 0.21",
            "CROSS_SECTION_EXTENT_Z 0.42",
            "RAY_MARCH_STEP_COUNT 24",
        ]);

        exhaust.dispose();
    });
});
