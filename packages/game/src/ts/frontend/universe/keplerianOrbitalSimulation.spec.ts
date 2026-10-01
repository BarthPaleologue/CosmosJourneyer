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

import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { KeplerianObject } from "./keplerianOrbitalSimulation";
import { KeplerianOrbitalSimulation } from "./keplerianOrbitalSimulation";

function createTestOrbitalObject(
    scene: Scene,
    {
        id,
        parentIds,
        semiMajorAxis,
        position = Vector3.Zero(),
        siderealPeriod = 0,
    }: {
        readonly id: string;
        readonly parentIds: ReadonlyArray<string>;
        readonly semiMajorAxis: number;
        readonly position?: Vector3;
        readonly siderealPeriod?: number;
    },
): KeplerianObject {
    const transform = new TransformNode(id, scene);
    transform.position.copyFrom(position);

    return {
        id,
        mass: 1,
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
        rotation: {
            axialTilt: 0,
            spinAxisAzimuth: 0,
            siderealPeriod,
            initialRotationAngle: 0,
        },
        getTransform: () => transform,
    };
}

describe("KeplerianOrbitalSimulation", () => {
    let engine: NullEngine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    it("computes nested child positions from authoritative parent states", () => {
        const star = createTestOrbitalObject(scene, {
            id: "star",
            parentIds: [],
            semiMajorAxis: 0,
            position: new Vector3(100, 0, 0),
        });
        const planet = createTestOrbitalObject(scene, { id: "planet", parentIds: ["star"], semiMajorAxis: 10 });
        const moon = createTestOrbitalObject(scene, { id: "moon", parentIds: ["planet"], semiMajorAxis: 3 });

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
        const reference = createTestOrbitalObject(scene, {
            id: "reference",
            parentIds: [],
            semiMajorAxis: 0,
            siderealPeriod: 4,
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
        const reference = createTestOrbitalObject(scene, {
            id: "reference",
            parentIds: [],
            semiMajorAxis: 0,
            siderealPeriod: 4,
        });
        const target = createTestOrbitalObject(scene, {
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
