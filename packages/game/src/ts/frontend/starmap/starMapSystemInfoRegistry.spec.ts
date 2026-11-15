import { describe, expect, it, vi } from "vitest";

import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";

import type { StarMapSystemInfoProvider } from "@/modules/starMapSystemInfo";
import { getVestaModel } from "@/modules/vesta/vesta";

import { StarMapSystemInfoRegistry } from "./starMapSystemInfoRegistry";

describe("star-map system information registry", () => {
    it("evaluates contributions against the selected system and entity models in registration order", () => {
        const info = new StarMapSystemInfoRegistry();
        const { starSystem, systemEntities } = getVestaModel();
        const content = { system: starSystem, entities: systemEntities };
        const contributeName = vi.fn<StarMapSystemInfoProvider>(({ system }) => system.name);
        info.register(contributeName);
        info.register(() => null);
        info.register(({ entities }) => `Entities: ${entities.length}`);

        expect(info.getInfo(content)).toEqual([starSystem.name, `Entities: ${systemEntities.length}`]);
        expect(contributeName).toHaveBeenCalledExactlyOnceWith(content);
    });

    it("re-evaluates providers for systems with no entities", () => {
        const info = new StarMapSystemInfoRegistry();
        info.register(({ entities }) => (entities.length > 0 ? "Has entities" : null));
        const { starSystem, systemEntities } = getVestaModel();
        expect(info.getInfo({ system: starSystem, entities: systemEntities })).toEqual(["Has entities"]);
        expect(info.getInfo({ system: getLoneStarSystem(), entities: [] })).toEqual([]);
    });

    it("keeps contributions within the game instance that registered them", () => {
        const first = new StarMapSystemInfoRegistry();
        const second = new StarMapSystemInfoRegistry();
        const content = { system: getLoneStarSystem(), entities: [] };
        first.register(() => "Only the first game");
        expect(first.getInfo(content)).toEqual(["Only the first game"]);
        expect(second.getInfo(content)).toEqual([]);
    });
});
