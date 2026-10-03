import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { getSolSystemModel } from "@/backend/universe/customSystems/sol/sol";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { MissionAsteroidFieldNode } from "./missionAsteroidFieldNode";

describe("MissionAsteroidFieldNode", () => {
    it("creates a mission for a ringed planet and describes its destination", async () => {
        const system = getSolSystemModel();
        const universeBackend = new UniverseBackend(new SystemEntityBackend(), system);
        const planet = system.planets.find((candidate) => candidate.rings !== null);
        if (planet === undefined) {
            throw new Error("Sol has no ringed planet");
        }
        const mission = MissionAsteroidFieldNode.New(
            { systemCoordinates: system.coordinates, idInSystem: planet.id },
            universeBackend,
        );
        expect(mission).not.toBeNull();
        const i18n = createInstance();
        await i18n.init({
            lng: "en-US",
            resources: {
                "en-US": {
                    missions: {
                        sightseeing: { describeAsteroidFieldTrek: "{{objectName}} in {{systemName}} ({{distance}})" },
                        common: { here: "here" },
                    },
                },
            },
        });
        expect(mission?.describe(system.coordinates, universeBackend, i18n.getFixedT("en-US"))).toBe(
            `${planet.name} in ${system.name} (here)`,
        );
    });

    it("rejects objects without planetary rings and missing objects", () => {
        const system = getSolSystemModel();
        const universeBackend = new UniverseBackend(new SystemEntityBackend(), system);
        for (const idInSystem of [system.stellarObjects[0].id, "missing"]) {
            expect(
                MissionAsteroidFieldNode.New({ systemCoordinates: system.coordinates, idInSystem }, universeBackend),
            ).toBeNull();
        }
    });
});
