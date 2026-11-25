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

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import {
    astronomicalUnitToMeters,
    EarthMagneticDipoleMoment,
    getMagnetopauseStandoffDistance,
    getStellarWind,
    getStellarWindDynamicPressure,
    SolarMass,
    SolarRadius,
    ampereSquareMeters,
    radians,
} from "@cosmos-journeyer/physics";
import type { MagneticFieldModel } from "@cosmos-journeyer/universe-model";
import { describe, expect, it } from "vitest";

import { MagnetosphereGizmo } from "./magnetosphereGizmo";

const planetRadius = 1000e3;
const magneticField: MagneticFieldModel = {
    north: { latitude: radians(Math.PI / 2), longitude: radians(0) },
    magnitude: ampereSquareMeters(EarthMagneticDipoleMoment / 6 ** 3),
};

const sunSource = {
    mass: SolarMass,
    radius: SolarRadius,
    position: new Vector3(astronomicalUnitToMeters(1), 0, 0),
};

describe("MagnetosphereGizmo", () => {
    it("enables lines and sizes the outermost line to the magnetopause standoff", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const gizmo = new MagnetosphereGizmo(planetRadius, magneticField, scene);
            gizmo.update([sunSource]);

            expect(gizmo.getTransform().isEnabled()).toBe(true);

            const wind = getStellarWind(SolarMass, SolarRadius, astronomicalUnitToMeters(1));
            const standoff = getMagnetopauseStandoffDistance(
                magneticField.magnitude,
                getStellarWindDynamicPressure(wind),
            );

            const lines = gizmo
                .getTransform()
                .getChildMeshes()
                .filter((mesh) => mesh.getClassName() === "LinesMesh");
            expect(lines.length).toBeGreaterThan(0);

            // the outermost line reaches the standoff distance at the magnetic equator
            let maxRadius = 0;
            for (const mesh of lines) {
                const positions = mesh.getVerticesData(VertexBuffer.PositionKind);
                if (positions === null) {
                    continue;
                }
                for (let i = 0; i < positions.length; i += 3) {
                    maxRadius = Math.max(
                        maxRadius,
                        Math.hypot(positions[i] ?? 0, positions[i + 1] ?? 0, positions[i + 2] ?? 0),
                    );
                }
            }
            console.log("standoff km:", standoff / 1e3, "maxRadius km:", maxRadius / 1e3, "lines:", lines.length);
            expect(maxRadius).toBeGreaterThan(0.999 * standoff);
            expect(maxRadius).toBeLessThanOrEqual(standoff * 1.001);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it("disables itself when the magnetosphere is crushed", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const gizmo = new MagnetosphereGizmo(planetRadius, magneticField, scene);
            gizmo.update([]);
            expect(gizmo.getTransform().isEnabled()).toBe(false);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});
