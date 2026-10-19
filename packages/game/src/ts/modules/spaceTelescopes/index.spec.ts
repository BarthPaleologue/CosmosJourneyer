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

import { NullEngine, NullEngineOptions } from "@babylonjs/core/Engines/nullEngine";
import { NodeMaterial } from "@babylonjs/core/Materials/Node/nodeMaterial";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import { PBRMetallicRoughnessMaterial } from "@babylonjs/core/Materials/PBR/pbrMetallicRoughnessMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { astronomicalUnitToMeters, getOrbitalPeriod } from "@cosmos-journeyer/physics";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CrateMaterial } from "@/frontend/assets/materials/crate";
import { FoilMaterial } from "@/frontend/assets/materials/foil";
import type { RenderingAssets } from "@/frontend/assets/renderingAssets";
import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";
import { TargetType } from "@/frontend/targeting/target";
import { KeplerianOrbitalSimulation } from "@/frontend/universe/keplerianOrbitalSimulation";
import { makeTaskId } from "@/frontend/universe/planets/telluricPlanet/terrain/system/terrainSystem";
import { TireMaterial } from "@/frontend/vehicle/tireMaterial";

import { SpaceTelescopesModule } from ".";
import type { GameModuleApi } from "../gameModuleApi";
import { getVestaModel } from "../vesta/vesta";

describe("space telescope module in Vesta", () => {
    let engine: NullEngine;
    let scene: Scene;
    let assets: RenderingAssets;
    let loader: SystemEntityLoader;
    let processors: SystemEntityProcessors;
    const registerProcedural = vi.fn();
    const registerUpdate = vi.fn();
    const registerAuthoredSystem = vi.fn();
    beforeEach(() => {
        const engineOptions = new NullEngineOptions();
        engineOptions.useHighPrecisionMatrix = true;
        engine = new NullEngine(engineOptions);
        scene = new Scene(engine);
        const shared = new PBRMaterial("sharedMaterial", scene);
        const texture = new Texture(null, scene);
        const common = { albedo: texture, normalHeight: texture, ambientOcclusion: texture };
        const materials = {
            foil: new FoilMaterial({ albedo: texture, normal: texture, roughness: texture }, scene),
            butterfly: shared,
            grass: shared,
            rock: shared,
            tree: new PBRMetallicRoughnessMaterial("tree", scene),
            tank: shared,
            landingPad: shared,
            metalSection: shared,
            glass: shared,
            solarPanel: new NodeMaterial("solarPanel", scene),
            crate: new CrateMaterial({ ...common, metallicRoughness: texture }, scene),
            tire: new TireMaterial({ ...common, roughness: texture }, scene),
        };
        assets = {
            materials,
            get textures(): RenderingAssets["textures"] {
                throw new Error("Texture assets are not used by this fixture");
            },
            get objects(): RenderingAssets["objects"] {
                throw new Error("Object assets are not used by this fixture");
            },
        };
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
                    semiMajorAxis: astronomicalUnitToMeters(3),
                    eccentricity: 0,
                    inclination: 0,
                    longitudeOfAscendingNode: 0,
                    argumentOfPeriapsis: 0,
                    initialMeanAnomaly: 0,
                    p: 2,
                },
                attitude: {
                    spin: {
                        siderealPeriod: getOrbitalPeriod(
                            astronomicalUnitToMeters(3),
                            starSystem.stellarObjects[0].mass,
                        ),
                    },
                    localFrameOrientation: { yaw: 0, pitch: 0, roll: -Math.PI / 2 },
                },
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
        expect(registerUpdate).toHaveBeenCalledWith("spaceTelescope", expect.any(Function));
        expect(registerAuthoredSystem).not.toHaveBeenCalled();
    });

    it("loads Vesta's telescope with radial pointing throughout its orbit, targeting and shadows", async () => {
        const { starSystem, systemEntities } = getVestaModel();
        const stellarObjects = starSystem.stellarObjects.map((star) => {
            const transform = new TransformNode(star.id, scene);
            return { ...star, getTransform: () => transform };
        });
        const orbitalSimulation = new KeplerianOrbitalSimulation(stellarObjects);
        const telescopeModels = systemEntities.filter((entity) => entity.content.type === "spaceTelescope");
        const context = {
            scene,
            assets,
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
        expect(initial?.position.length()).toBeCloseTo(astronomicalUnitToMeters(3), 0);
        const parent = starSystem.stellarObjects[0];
        const orbitalPeriod = getOrbitalPeriod(astronomicalUnitToMeters(3), parent.mass);
        orbitalSimulation.update(orbitalPeriod / 4);
        const advanced = orbitalSimulation.getTransform(entity.model.id);
        expect(advanced?.position.length()).toBeCloseTo(astronomicalUnitToMeters(3), 0);
        expect(advanced?.position.equalsWithEpsilon(initial?.position ?? entity.content.getTransform().position)).toBe(
            false,
        );
        expect(advanced?.orientation.asArray()).not.toEqual(initial?.orientation.asArray());
        [0, 0.125, 0.25, 0.5, 0.75, 1].forEach((phase) => {
            orbitalSimulation.update(orbitalPeriod * phase);
            const telescopeTransform = orbitalSimulation.getTransform(entity.model.id);
            const starTransform = orbitalSimulation.getTransform(parent.id);
            expect(telescopeTransform).toBeDefined();
            expect(starTransform).toBeDefined();
            if (telescopeTransform === undefined || starTransform === undefined) {
                return;
            }
            const placement = entity.placement.getTransform();
            placement.position.copyFrom(telescopeTransform.position);
            placement.rotationQuaternion = telescopeTransform.orientation.clone();
            placement.computeWorldMatrix(true);
            entity.content.getTransform().computeWorldMatrix(true);
            const opticalAxis = entity.content.getTransform().getDirection(Vector3.UpReadOnly).normalize();
            const radialOut = telescopeTransform.position.subtract(starTransform.position).normalize();
            expect(Vector3.Dot(opticalAxis, radialOut)).toBeCloseTo(1, 8);
        });
        const sheets = entity.content
            .getTransform()
            .getChildMeshes()
            .filter((mesh) => mesh.name.startsWith("insulationSheet"));
        expect(sheets.every((sheet) => sheet.material === assets.materials.foil.get())).toBe(true);
        entity.content.dispose();
        expect(scene.materials).toContain(assets.materials.foil.get());
        entity.placement.getTransform().dispose();
    });

    it("rejects invalid content before allocating scene resources", async () => {
        const { systemEntities } = getVestaModel();
        const model = systemEntities.find((entity) => entity.content.type === "spaceTelescope");
        expect(model).toBeDefined();
        if (model === undefined) {
            return;
        }
        const baselineMaterials = scene.materials.length;
        const result = await loader.load([{ ...model, content: { type: "spaceTelescope" } }], {
            scene,
            assets,
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
        expect(scene.materials).toHaveLength(baselineMaterials);
    });
});
