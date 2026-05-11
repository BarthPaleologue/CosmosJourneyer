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

import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { describe, expect, it } from "vitest";

import { type OrbitalObject } from "./architecture/orbitalObject";
import { KeplerianOrbitalSimulation } from "./keplerianOrbitalSimulation";

function createTestOrbitalObject({
    id,
    parentIds,
    semiMajorAxis,
    position = Vector3.Zero(),
    siderealDaySeconds = 0,
}: {
    readonly id: string;
    readonly parentIds: ReadonlyArray<string>;
    readonly semiMajorAxis: number;
    readonly position?: Vector3;
    readonly siderealDaySeconds?: number;
}): OrbitalObject {
    return {
        type: "custom",
        model: {
            type: "custom",
            id,
            name: id,
            orbit: {
                parentIds,
                argumentOfPeriapsis: 0,
                semiMajorAxis,
                initialMeanAnomaly: 0,
                longitudeOfAscendingNode: 0,
                inclination: 0,
                eccentricity: 0,
                p: 2,
            },
            axialTilt: 0,
            mass: 1,
            siderealDaySeconds,
        },
        getTransform: () => ({
            position,
            rotationQuaternion: Quaternion.Identity(),
        }),
    } as unknown as OrbitalObject;
}

describe("KeplerianOrbitalSimulation", () => {
    it("computes nested child positions from authoritative parent states", () => {
        const star = createTestOrbitalObject({
            id: "star",
            parentIds: [],
            semiMajorAxis: 0,
            position: new Vector3(100, 0, 0),
        });
        const planet = createTestOrbitalObject({ id: "planet", parentIds: ["star"], semiMajorAxis: 10 });
        const moon = createTestOrbitalObject({ id: "moon", parentIds: ["planet"], semiMajorAxis: 3 });

        const simulation = new KeplerianOrbitalSimulation([star, planet, moon]);
        simulation.update(0);

        const planetTransform = simulation.getTransform("planet");
        const moonTransform = simulation.getTransform("moon");

        expect(planetTransform).toBeDefined();
        expect(moonTransform).toBeDefined();
        if (planetTransform === undefined || moonTransform === undefined) {
            return;
        }

        expect(planetTransform.position.x).toBeCloseTo(110);
        expect(moonTransform.position.x).toBeCloseTo(113);
    });

    it("returns a body-fixed relative state for the reference object", () => {
        const reference = createTestOrbitalObject({
            id: "reference",
            parentIds: [],
            semiMajorAxis: 0,
            siderealDaySeconds: 4,
        });

        const simulation = new KeplerianOrbitalSimulation([reference]);
        simulation.update(1);

        const relativeTransform = simulation.getRelativeTransform("reference", "reference", "reference");

        expect(relativeTransform).toBeDefined();
        if (relativeTransform === undefined) {
            return;
        }

        expect(relativeTransform.position.length()).toBeCloseTo(0);
        expect(relativeTransform.orientation.x).toBeCloseTo(0);
        expect(relativeTransform.orientation.y).toBeCloseTo(0);
        expect(relativeTransform.orientation.z).toBeCloseTo(0);
        expect(relativeTransform.orientation.w).toBeCloseTo(1);
    });

    it("can keep relative positions in the inertial frame when reference rotation is not compensated", () => {
        const reference = createTestOrbitalObject({
            id: "reference",
            parentIds: [],
            semiMajorAxis: 0,
            siderealDaySeconds: 4,
        });
        const target = createTestOrbitalObject({
            id: "target",
            parentIds: [],
            semiMajorAxis: 0,
            position: new Vector3(1, 0, 0),
        });

        const simulation = new KeplerianOrbitalSimulation([reference, target]);
        simulation.update(1);

        const relativeTransform = simulation.getRelativeTransform("target", "reference", "inertial");

        expect(relativeTransform).toBeDefined();
        if (relativeTransform === undefined) {
            return;
        }

        expect(relativeTransform.position.x).toBeCloseTo(1);
        expect(relativeTransform.position.y).toBeCloseTo(0);
        expect(relativeTransform.position.z).toBeCloseTo(0);
    });

    it("returns undefined for missing objects", () => {
        const simulation = new KeplerianOrbitalSimulation([]);

        expect(simulation.getTransform("missing")).toBeUndefined();
        expect(simulation.getRelativeTransform("missing", "missing", "reference")).toBeUndefined();
    });
});
