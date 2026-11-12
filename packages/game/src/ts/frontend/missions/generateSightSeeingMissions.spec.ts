import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { generateMandelbulbModel } from "@cosmos-journeyer/universe-generation";
import type { UniverseObjectId } from "@cosmos-journeyer/universe-model";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { getSolSystemModel } from "@/backend/universe/customSystems/sol/sol";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { getNeighborStarSystemCoordinates } from "@/frontend/helpers/getNeighborStarSystems";
import { Player } from "@/frontend/player/player";

import { generateSightseeingMissions } from "./generateSightSeeingMissions";

vi.mock("@/frontend/helpers/getNeighborStarSystems", () => ({ getNeighborStarSystemCoordinates: vi.fn() }));

describe("station mission generation by universe ID", () => {
    let backend: UniverseBackend;
    let player: Player;
    let stationId: UniverseObjectId;
    const timestamp = Date.UTC(2026, 10, 12, 12);
    beforeEach(() => {
        backend = new UniverseBackend(new SystemEntityBackend());
        const system = getSolSystemModel();
        const neighbor = getLoneStarSystem();
        neighbor.coordinates = { ...system.coordinates, localX: 0.05 };
        neighbor.anomalies = Array.from({ length: 32 }, (_, index) =>
            generateMandelbulbModel(`anomaly-${index}`, index, `Anomaly ${index}`, neighbor.stellarObjects),
        );
        backend.registerAuthoredSystem(system);
        backend.registerAuthoredSystem(neighbor);
        vi.mocked(getNeighborStarSystemCoordinates).mockReturnValue([
            { coordinates: neighbor.coordinates, position: new Vector3(1, 0, 0), distance: 1 },
        ]);
        player = Player.Default(backend);
        stationId = { systemCoordinates: system.coordinates, idInSystem: "module-station" };
    });
    afterEach(() => vi.restoreAllMocks());

    /**
     * @param id Station offering the missions.
     * @param time Timestamp used to select the hourly mission set.
     * @returns Missions generated without requiring an orbital facility model.
     */
    function generate(id: UniverseObjectId, time: number) {
        const result = generateSightseeingMissions(id, backend, player, time);
        if (!result.success) {
            throw result.error;
        }
        return result.value;
    }

    it("uses the supplied universe ID as the mission giver without a station model", () => {
        const missions = generate(stationId, timestamp);
        expect(missions.length).toBeGreaterThan(0);
        for (const mission of missions) {
            expect(mission.serialize().missionGiver).toEqual(stationId);
        }
    });

    it("keeps the same hourly set for equal IDs and samples new sets for another station or hour", () => {
        const first = generate(stationId, timestamp).map((mission) => mission.serialize().tree);
        expect(
            generate({ ...stationId, systemCoordinates: { ...stationId.systemCoordinates } }, timestamp + 59_999).map(
                (mission) => mission.serialize().tree,
            ),
        ).toEqual(first);
        expect(
            generate({ ...stationId, idInSystem: "other-station" }, timestamp).map(
                (mission) => mission.serialize().tree,
            ),
        ).not.toEqual(first);
        expect(generate(stationId, timestamp + 3_600_000).map((mission) => mission.serialize().tree)).not.toEqual(
            first,
        );
    });

    it("excludes already accepted and completed missions", () => {
        const [accepted, completed] = generate(stationId, timestamp);
        if (accepted === undefined || completed === undefined) {
            throw new Error("Expected two available missions");
        }
        player.currentMissions.push(accepted);
        player.completedMissions.push(completed);
        const remaining = generate(stationId, timestamp);
        expect(remaining.length).toBeGreaterThan(0);
        expect(remaining.some((mission) => mission.equals(accepted) || mission.equals(completed))).toBe(false);
    });

    it("returns an error when the station system cannot be resolved", () => {
        vi.spyOn(backend, "getSystemContentModelAt").mockReturnValue(null);
        const result = generateSightseeingMissions(stationId, backend, player, timestamp);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.message).toContain(stationId.idInSystem);
        }
    });
});
