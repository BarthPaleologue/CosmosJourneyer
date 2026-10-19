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
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { astronomicalUnitToMeters, SolarMass } from "@cosmos-journeyer/physics";
import {
    generateJuliaSetModel,
    generateMandelboxModel,
    generateMandelbulbModel,
    generateMengerSpongeModel,
    generateSierpinskiPyramidModel,
    generateSpaceStationModel,
    generateSpaceElevatorModel,
} from "@cosmos-journeyer/universe-generation";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getChronosModel } from "@/modules/chronos/chronos";
import { getVestaModel } from "@/modules/vesta/vesta";

import { KeplerianOrbitalSimulation } from "./keplerianOrbitalSimulation";
import type { KeplerianObject } from "./keplerianOrbitalSimulation";
import { getMostInfluentialObject, getNavigationReferenceFrame } from "./orbitalReference";

describe("orbital reference selection", () => {
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

    function object(id: string, mass: number, position: Vector3): KeplerianObject {
        const transform = new TransformNode(id, scene);
        transform.position.copyFrom(position);
        return {
            id,
            mass,
            getTransform: () => transform,
            orbit: {
                parentIds: [],
                semiMajorAxis: 0,
                eccentricity: 0,
                inclination: 0,
                argumentOfPeriapsis: 0,
                longitudeOfAscendingNode: 0,
                initialMeanAnomaly: 0,
                p: 2,
            },
            spin: { axialTilt: 0, axisAzimuth: 0, siderealPeriod: 0, initialRotationAngle: 0 },
        };
    }

    function placeModels(
        models: ReadonlyArray<Pick<KeplerianObject, "id" | "mass" | "orbit" | "spin">>,
        time = 0,
    ): KeplerianOrbitalSimulation {
        const objects = models.map((model) => ({ ...object(model.id, model.mass, Vector3.Zero()), ...model }));
        const simulation = new KeplerianOrbitalSimulation(objects);
        simulation.update(time);
        for (const entry of simulation.getObjects()) {
            const transform = simulation.getTransform(entry.id);
            if (transform !== undefined) {
                entry.getTransform().position.copyFrom(transform.position);
            }
        }
        return simulation;
    }

    it("returns undefined for an empty simulation", () => {
        expect(getMostInfluentialObject([], Vector3.Zero())).toBeUndefined();
    });

    it("prefers mass at equal distance and keeps the first candidate on ties", () => {
        const light = object("light", 1, new Vector3(-10, 0, 0));
        const heavy = object("heavy", 2, new Vector3(10, 0, 0));
        expect(getMostInfluentialObject([light, heavy], Vector3.Zero())).toBe(heavy);
        const tied = object("tied", 2, new Vector3(-10, 0, 0));
        expect(getMostInfluentialObject([heavy, tied], Vector3.Zero())).toBe(heavy);
    });

    it("handles an observer exactly at a candidate without dividing by zero", () => {
        const star = object("star", SolarMass, Vector3.Zero());
        const telescope = object("telescope", 100_000, new Vector3(100, 0, 0));
        expect(getMostInfluentialObject([star, telescope], new Vector3(100, 0, 0))).toBe(telescope);
    });

    it("uses world positions for parented objects", () => {
        const parent = new TransformNode("parent", scene);
        parent.position.x = 1e12;
        const telescope = object("telescope", 100_000, new Vector3(100, 0, 0));
        telescope.getTransform().parent = parent;
        const star = object("star", SolarMass, Vector3.Zero());
        expect(getMostInfluentialObject([star, telescope], new Vector3(1e12 + 101, 0, 0))).toBe(telescope);
    });

    it("selects the telescope at a million km where a sixth-power score still selects the star", () => {
        const star = object("star", SolarMass, Vector3.Zero());
        const telescope = object("telescope", 100_000, new Vector3(astronomicalUnitToMeters(3), 0, 0));
        const observer = telescope.getTransform().position.add(new Vector3(0, 1e9, 0));
        const sixthPower = (entry: KeplerianObject) =>
            entry.mass / Vector3.DistanceSquared(entry.getTransform().getAbsolutePosition(), observer) ** 3;
        expect(sixthPower(star)).toBeGreaterThan(sixthPower(telescope));
        expect(getMostInfluentialObject([star, telescope], observer)).toBe(telescope);
        expect(
            getMostInfluentialObject([star, telescope], telescope.getTransform().position.add(new Vector3(0, 1e11, 0))),
        ).toBe(star);
    });

    it.each([
        [1_800e3, "teapot"],
        [1_900e3, "giant"],
    ] as const)("at %s meters from a 1 kg teapot, selects %s using mass and distance", (distance, expected) => {
        const giant = object("giant", 2e27, Vector3.Zero());
        const teapot = object("teapot", 1, new Vector3(1e9, 0, 0));
        const observer = teapot.getTransform().position.subtract(new Vector3(distance, 0, 0));
        expect(Vector3.Distance(observer, teapot.getTransform().position)).toBeLessThan(
            Vector3.Distance(observer, giant.getTransform().position),
        );
        expect(getMostInfluentialObject([giant, teapot], observer)?.id).toBe(expected);
    });

    it.each([0, 86400])(
        "selects Vesta's telescope and station near their current orbital positions at t=%s",
        (time) => {
            const { starSystem, systemEntities } = getVestaModel();
            const models = [
                ...starSystem.stellarObjects,
                ...starSystem.planets,
                ...starSystem.satellites,
                ...starSystem.orbitalFacilities,
                ...systemEntities.flatMap((entity) =>
                    entity.placement.type === "inOrbit"
                        ? [{ id: entity.id, ...entity.placement, spin: entity.placement.attitude.spin }]
                        : [],
                ),
            ];
            const simulation = placeModels(models, time);
            for (const id of ["vestaSpaceTelescope", "newJulesVerne"]) {
                const target = simulation.getTransform(id);
                expect(target).toBeDefined();
                if (target === undefined) {
                    continue;
                }
                const observer = target.position.add(new Vector3(0, 20_000, 0));
                expect(getMostInfluentialObject(simulation.getObjects(), observer)?.id).toBe(id);
            }
            const planet = simulation.getTransform("aphrodite");
            expect(planet).toBeDefined();
            if (planet !== undefined) {
                expect(
                    getMostInfluentialObject(simulation.getObjects(), planet.position.add(new Vector3(0, 2e6, 0)))?.id,
                ).toBe("aphrodite");
            }
        },
    );

    it("keeps generated stations and elevators selectable near their orbital terminals", () => {
        const { starSystem } = getVestaModel();
        const planet = starSystem.planets.find((model) => model.type === "telluricPlanet");
        expect(planet).toBeDefined();
        if (planet === undefined) {
            return;
        }
        const facilities = [
            generateSpaceStationModel("station", 42, planet, starSystem),
            generateSpaceElevatorModel("elevator", 42, planet, starSystem),
        ];
        for (const facility of facilities) {
            const simulation = placeModels([...starSystem.stellarObjects, ...starSystem.planets, facility]);
            const position = simulation.getTransform(facility.id)?.position;
            expect(position).toBeDefined();
            if (position === undefined) {
                continue;
            }
            expect(getMostInfluentialObject(simulation.getObjects(), position.add(new Vector3(0, 20_000, 0)))?.id).toBe(
                facility.id,
            );
        }
    });

    it.each([
        generateJuliaSetModel,
        generateMandelboxModel,
        generateMandelbulbModel,
        generateMengerSpongeModel,
        generateSierpinskiPyramidModel,
    ])("keeps generated anomalies selectable outside their surface (%s)", (generateModel) => {
        const { starSystem } = getVestaModel();
        const anomaly = generateModel("anomaly", 42, "Anomaly", [...starSystem.stellarObjects]);
        const simulation = placeModels([...starSystem.stellarObjects, anomaly]);
        const position = simulation.getTransform(anomaly.id)?.position;
        expect(position).toBeDefined();
        if (position === undefined) {
            return;
        }
        expect(
            getMostInfluentialObject(simulation.getObjects(), position.add(new Vector3(0, anomaly.radius * 1.5, 0)))
                ?.id,
        ).toBe(anomaly.id);
    });

    it("selects Chronos Research Lab outside its habitat where a fourth-power score selects Chronos", () => {
        const { systemModel, systemEntityModels } = getChronosModel();
        const models = [
            ...systemModel.stellarObjects,
            ...systemEntityModels.flatMap((entity) =>
                entity.placement.type === "inOrbit"
                    ? [{ id: entity.id, ...entity.placement, spin: entity.placement.attitude.spin }]
                    : [],
            ),
            ...systemModel.orbitalFacilities,
        ];
        const simulation = placeModels(models);
        const lab = simulation.getTransform("chronosResearchLab");
        expect(lab).toBeDefined();
        if (lab === undefined) {
            return;
        }
        const observer = lab.position.add(new Vector3(0, 20_000, 0));
        let bestFourth: KeplerianObject | undefined;
        let bestScore = -Infinity;
        for (const entry of simulation.getObjects()) {
            const score =
                entry.mass / Vector3.DistanceSquared(entry.getTransform().getAbsolutePosition(), observer) ** 2;
            if (score > bestScore) {
                bestScore = score;
                bestFourth = entry;
            }
        }
        expect(bestFourth?.id).toBe("chronos");
        expect(getMostInfluentialObject(simulation.getObjects(), observer)?.id).toBe("chronosResearchLab");
        const ananke = simulation.getTransform("ananke");
        expect(ananke).toBeDefined();
        if (ananke !== undefined) {
            expect(
                getMostInfluentialObject(simulation.getObjects(), ananke.position.add(new Vector3(0, 110_000, 0)))?.id,
            ).toBe("ananke");
        }
    });
});

describe("navigation rotation frame", () => {
    it.each([
        [0, "reference"],
        [1, "inertial"],
        [-1, "inertial"],
        [599.999, "inertial"],
        [-599.999, "inertial"],
        [600, "reference"],
        [-600, "reference"],
        [600.001, "reference"],
        [-600.001, "reference"],
        [86400, "reference"],
    ] as const)("uses the %s-second rotation period to select the %s frame", (period, expected) => {
        expect(getNavigationReferenceFrame(period)).toBe(expected);
    });
});
