import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { describe, expect, it, vi } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { createGameModuleApi } from "@/frontend/createGameModuleApi";
import { StarMapSystemInfoRegistry } from "@/frontend/starmap/starMapSystemInfoRegistry";
import type { SystemEntity } from "@/frontend/systemEntity/systemEntity";
import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";
import { TargetType } from "@/frontend/targeting/target";

import { OrbitalFacilitiesModule } from ".";
import { getVestaModel } from "../vesta/vesta";

describe("orbital facility rendering", () => {
    it.each(["spaceStation", "spaceElevator"])("keeps a stable lighting region and culls %s on update", (type) => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const camera = new FreeCamera("camera", Vector3.Zero(), scene);
        const processors = new SystemEntityProcessors();
        const api = createGameModuleApi(
            new UniverseBackend(new SystemEntityBackend()),
            new SystemEntityLoader(),
            processors,
            new StarMapSystemInfoRegistry(),
        );
        OrbitalFacilitiesModule.setup(api);
        const content = {
            update: vi.fn(),
            computeCulling: vi.fn(),
            getLandingPadProvider: () => ({ getLandingPads: () => [] }),
            getLandingBays: () => [],
            getClimber: () => ({ getTransform: vi.fn(), getBoundingRadius: vi.fn() }),
        };
        const entity = { model: { name: "Facility", content: { type } }, content } as unknown as SystemEntity;
        try {
            expect(processors.lightingRegions.dispatch(entity)).toBe(content);
            expect(processors.lightingRegions.dispatch(entity)).toBe(content);
            processors.updateEntities([entity], { observerPosition: camera.position, deltaSeconds: 1, camera });
            expect(content.update).toHaveBeenCalledWith(camera.position, 1);
            expect(content.computeCulling).toHaveBeenCalledWith(camera);
            expect(processors.targeting.dispatch(entity)[0]?.type).toBe(
                type === "spaceStation" ? TargetType.SPACE_STATION : TargetType.SPACE_ELEVATOR,
            );
        } finally {
            processors.dispose();
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("orbital facility generation", () => {
    it.each([
        { galacticPosition: { x: 0, y: 0, z: 0 }, populated: true },
        { galacticPosition: { x: 10_000, y: 0, z: 0 }, populated: false },
    ])("uses the resolved position $galacticPosition for the human bubble", ({ galacticPosition, populated }) => {
        const backend = new UniverseBackend(new SystemEntityBackend());
        const system = getVestaModel().starSystem;
        backend.registerAuthoredSystem(system);
        vi.spyOn(backend, "getSystemGalacticPosition").mockReturnValue(galacticPosition);
        const processors = new SystemEntityProcessors();
        OrbitalFacilitiesModule.setup(
            createGameModuleApi(backend, new SystemEntityLoader(), processors, new StarMapSystemInfoRegistry()),
        );
        try {
            const content = backend.getSystemContentModelAt(system.coordinates);
            expect(content).not.toBeNull();
            expect((content?.entities.length ?? 0) > 0).toBe(populated);
        } finally {
            processors.dispose();
        }
    });
});
