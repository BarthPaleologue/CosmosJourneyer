import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { ModuleAssetRegistry } from "@/frontend/assets/moduleAssetRegistry";
import { createGameModuleApi } from "@/frontend/createGameModuleApi";
import { StarMapSystemInfoRegistry } from "@/frontend/starmap/starMapSystemInfoRegistry";
import type { SystemEntity } from "@/frontend/systemEntity/systemEntity";
import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";
import { TargetType } from "@/frontend/targeting/target";
import { LandingPadProvider } from "@/frontend/universe/orbitalFacility/landingPadProvider";

import { I18n } from "@/i18n";
import { Settings } from "@/settings";

import { OrbitalFacilitiesModule } from ".";
import { getVestaModel } from "../vesta/vesta";

describe("orbital facilities module", () => {
    let backend: UniverseBackend;
    let processors: SystemEntityProcessors;
    beforeEach(async () => {
        backend = new UniverseBackend(new SystemEntityBackend());
        processors = new SystemEntityProcessors();
        OrbitalFacilitiesModule.setup(
            createGameModuleApi(
                backend,
                new SystemEntityLoader(),
                processors,
                new ModuleAssetRegistry(),
                new StarMapSystemInfoRegistry(),
                await I18n.New(),
            ),
        );
    });
    afterEach(() => {
        processors.dispose();
    });

    it.each(["spaceStation", "spaceElevator"])("keeps a stable lighting region and culls %s on update", (type) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const pads = new LandingPadProvider([]);
        const content = {
            getLandingPadProvider: () => pads,
            getBoundingRadius: () => 100,
            update: vi.fn(),
            computeCulling: vi.fn(),
            getLandingBays: () => [],
            getClimber: () => ({ getTransform: vi.fn(), getBoundingRadius: vi.fn() }),
        };
        const entity = { model: { name: "Facility", content: { type } }, content } as unknown as SystemEntity;
        try {
            expect(processors.spatialGeometry.dispatch(entity)).toBe(content);
            expect(processors.landingPadProviders.dispatch(entity)).toBe(pads);
            expect(processors.music.dispatch(entity, { distance: 999 })).toEqual(["equatorialComplex"]);
            expect(processors.music.dispatch(entity, { distance: 1000 })).toEqual([]);
            expect(processors.lightingRegions.dispatch(entity)).toBe(content);
            expect(processors.lightingRegions.dispatch(entity)).toBe(content);
            processors.updateEntities([entity], { observerPosition: camera.position, deltaSeconds: 1, camera });
            expect(content.update).toHaveBeenCalledWith(camera.position, 1);
            expect(content.computeCulling).toHaveBeenCalledWith(camera);
            expect(processors.targeting.dispatch(entity)[0]?.type).toBe(
                type === "spaceStation" ? TargetType.SPACE_STATION : TargetType.SPACE_ELEVATOR,
            );
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });

    it.each([
        { galacticPosition: { x: 0, y: 0, z: 0 }, populated: true },
        { galacticPosition: { x: Settings.HUMAN_BUBBLE_RADIUS_LY - 1, y: 0, z: 0 }, populated: true },
        { galacticPosition: { x: Settings.HUMAN_BUBBLE_RADIUS_LY, y: 0, z: 0 }, populated: false },
        { galacticPosition: { x: 10_000, y: 0, z: 0 }, populated: false },
    ])("uses the resolved position $galacticPosition for the human bubble", ({ galacticPosition, populated }) => {
        const coordinates = backend.getSystemCoordinatesInStarSector(0, 0, 0)[0];
        if (coordinates === undefined) {
            throw new Error("Expected a generated system");
        }
        vi.spyOn(backend, "getSystemGalacticPosition").mockReturnValue(galacticPosition);
        const content = backend.getSystemContentModelAt(coordinates);
        expect(content).not.toBeNull();
        expect((content?.entities.length ?? 0) > 0).toBe(populated);
    });
    it("keeps authored facilities without adding procedural installations", () => {
        const { starSystem, systemEntities } = getVestaModel();
        backend.registerAuthoredSystem(starSystem);
        backend.registerAuthoredEntities(starSystem.coordinates, systemEntities);
        expect(backend.getSystemContentModelAt(starSystem.coordinates)?.entities).toEqual(systemEntities);
    });

    it("generates repeatable facilities independently for each system", () => {
        const selectedCoordinates = backend
            .getSystemCoordinatesInStarSector(0, 0, 0)
            .filter((coordinates) => (backend.getSystemContentModelAt(coordinates)?.system.planets.length ?? 0) > 0)
            .slice(0, 2);
        expect(selectedCoordinates).toHaveLength(2);
        const facilities = selectedCoordinates.map(
            (coordinates) => backend.getSystemContentModelAt(coordinates)?.entities,
        );
        for (const [index, systemCoordinates] of selectedCoordinates.entries()) {
            expect(facilities[index]?.length).toBeGreaterThan(0);
            expect(backend.getSystemContentModelAt(systemCoordinates)?.entities).toEqual(facilities[index]);
            for (const entity of facilities[index] ?? []) {
                expect(backend.getObjectModel({ systemCoordinates, idInSystem: entity.id })).toEqual({
                    type: "systemEntity",
                    object: entity,
                });
            }
        }
        expect(facilities[0]).not.toEqual(facilities[1]);
    });
});
