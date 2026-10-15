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
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { astronomicalUnitToMeters, getOrbitalPeriod } from "@cosmos-journeyer/physics";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";
import { TargetType } from "@/frontend/targeting/target";
import { KeplerianOrbitalSimulation } from "@/frontend/universe/keplerianOrbitalSimulation";
import { makeTaskId } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystem";

import { SpaceTelescopesModule } from ".";
import type { GameModuleApi } from "../gameModuleApi";
import { getVestaModel } from "../vesta/vesta";

describe("space telescope module in Vesta", () => {
    let engine: NullEngine;
    let scene: Scene;
    let loader: SystemEntityLoader;
    let processors: SystemEntityProcessors;
    const registerProcedural = vi.fn();
    const registerUpdate = vi.fn();
    const registerAuthoredSystem = vi.fn();
    beforeEach(() => {
        engine = new NullEngine();
        scene = new Scene(engine);
        loader = new SystemEntityLoader();
        processors = new SystemEntityProcessors();
        const api: GameModuleApi = {
            starSystems: { registerAuthored: registerAuthoredSystem },
            systemEntities: {
                registerAuthored: vi.fn(),
                registerProcedural,
                registerUpdate,
                registerContentFactory: (type, factory) => {
                    loader.registerFactory(type, factory);
                },
            },
            targeting: {
                systemEntities: {
                    register: (type, processor) => {
                        processors.targeting.register(type, processor);
                    },
                },
            },
            music: { systemEntities: { register: vi.fn() } },
            rendering: {
                shadows: {
                    systemEntities: {
                        registerShadowCasters: (type, processor) => {
                            processors.shadowCasters.register(type, processor);
                        },
                        registerSphereOccluders: vi.fn(),
                    },
                },
            },
        };
        SpaceTelescopesModule.setup(api);
    });
    afterEach(() => {
        processors.dispose();
        scene.dispose();
        engine.dispose();
    });

    it("authors exactly one telescope with unique identifiers alongside the monolith", () => {
        const { starSystem, systemEntities } = getVestaModel();
        const telescopes = systemEntities.filter((entity) => entity.content.type === "spaceTelescope");
        expect(telescopes).toHaveLength(1);
        expect(telescopes[0]).toMatchObject({
            id: "vestaSpaceTelescope",
            name: "Vesta Deep Space Telescope",
            placement: {
                type: "inOrbit",
                mass: 100_000,
                orbit: {
                    parentIds: ["vesta"],
                    semiMajorAxis: astronomicalUnitToMeters(30),
                    eccentricity: 0,
                    inclination: 0,
                    longitudeOfAscendingNode: 0,
                    argumentOfPeriapsis: 0,
                    initialMeanAnomaly: 0,
                    p: 2,
                },
                rotation: { siderealPeriod: 0 },
            },
        });
        expect(systemEntities.some((entity) => entity.id === "monolith")).toBe(true);
        expect(starSystem.orbitalFacilities.map((facility) => facility.id)).toEqual(["newJulesVerne"]);
        const ids = [
            ...systemEntities,
            ...starSystem.stellarObjects,
            ...starSystem.planets,
            ...starSystem.satellites,
            ...starSystem.anomalies,
            ...starSystem.orbitalFacilities,
        ].map((entity) => entity.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(registerProcedural).not.toHaveBeenCalled();
        expect(registerUpdate).not.toHaveBeenCalled();
        expect(registerAuthoredSystem).not.toHaveBeenCalled();
    });

    it("loads the registered factory, attaches content to its orbital placement and exposes targeting and shadows", async () => {
        const { starSystem, systemEntities } = getVestaModel();
        const stellarObjects = starSystem.stellarObjects.map((star) => ({
            ...star,
            getTransform: () => new TransformNode(star.id, scene),
        }));
        const orbitalSimulation = new KeplerianOrbitalSimulation(stellarObjects);
        const telescopeModels = systemEntities.filter((entity) => entity.content.type === "spaceTelescope");
        const context = {
            scene,
            orbitalObjects: [],
            orbitalSimulation,
            terrainSystem: {
                requestChunk: vi.fn(),
                getChunkOutput: vi.fn(),
                requestHeights: vi.fn(() => makeTaskId("unused")),
                getHeightsOutput: vi.fn(),
                update: vi.fn(),
                reset: vi.fn(),
            },
        };
        const loaded = await loader.load(telescopeModels, context);
        expect(loaded.success).toBe(true);
        if (!loaded.success) {
            return;
        }
        const entity = loaded.value[0];
        expect(entity).toBeDefined();
        if (entity === undefined) {
            return;
        }
        expect(entity.content.getTransform().parent).toBe(entity.placement.getTransform());
        const targets = processors.targeting.dispatch(entity, undefined);
        expect(targets).toHaveLength(1);
        expect(targets[0]?.type).toBe(TargetType.CUSTOM);
        expect(targets[0]?.properName).toBe("Vesta Deep Space Telescope");
        expect(targets[0]?.getTransform()).toBe(entity.content.getTransform());
        expect(targets[0]?.getBoundingRadius()).toBeGreaterThan(100);
        expect(targets[0]?.getBoundingRadius()).toBeLessThan(150);
        expect(processors.shadowCasters.dispatch(entity, undefined)).toEqual([entity.content.getTransform()]);
        const initial = orbitalSimulation.getTransform(entity.model.id);
        expect(initial?.position.length()).toBeCloseTo(astronomicalUnitToMeters(30), 0);
        const parent = starSystem.stellarObjects[0];
        orbitalSimulation.update(getOrbitalPeriod(astronomicalUnitToMeters(30), parent.mass) / 4);
        const advanced = orbitalSimulation.getTransform(entity.model.id);
        expect(advanced?.position.length()).toBeCloseTo(astronomicalUnitToMeters(30), 0);
        expect(advanced?.position.equalsWithEpsilon(initial?.position ?? entity.content.getTransform().position)).toBe(
            false,
        );
        expect(advanced?.orientation.asArray()).toEqual(initial?.orientation.asArray());
        entity.content.dispose();
        entity.placement.getTransform().dispose();
    });

    it("rejects invalid content before allocating scene resources", async () => {
        const { systemEntities } = getVestaModel();
        const model = systemEntities.find((entity) => entity.content.type === "spaceTelescope");
        expect(model).toBeDefined();
        if (model === undefined) {
            return;
        }
        const result = await loader.load([{ ...model, content: { type: "spaceTelescope" } }], {
            scene,
            orbitalObjects: [],
            orbitalSimulation: new KeplerianOrbitalSimulation([]),
            terrainSystem: {
                requestChunk: vi.fn(),
                getChunkOutput: vi.fn(),
                requestHeights: vi.fn(() => makeTaskId("unused")),
                getHeightsOutput: vi.fn(),
                update: vi.fn(),
                reset: vi.fn(),
            },
        });
        expect(result.success).toBe(false);
        expect(scene.meshes).toHaveLength(0);
        expect(scene.transformNodes).toHaveLength(0);
        expect(scene.materials).toHaveLength(0);
    });
});
