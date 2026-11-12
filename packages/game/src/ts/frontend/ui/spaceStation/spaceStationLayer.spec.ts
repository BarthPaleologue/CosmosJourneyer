import { createInstance } from "i18next";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EncyclopaediaGalacticaManager } from "@/backend/encyclopaedia/encyclopaediaGalacticaManager";
import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { getSolSystemModel } from "@/backend/universe/customSystems/sol/sol";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { Player } from "@/frontend/player/player";
import * as dialogModal from "@/frontend/ui/dialogModal";
import { NotificationManagerMock } from "@/frontend/ui/notificationManager";

import enUS from "../../../../locales/en-US/spaceStation.json";
import { SpaceStationLayer } from "./spaceStationLayer";

describe("station service identity", () => {
    const stationId = { systemCoordinates: getSolSystemModel().coordinates, idInSystem: "station" };
    let layer: SpaceStationLayer;
    let player: Player;
    let backend: UniverseBackend;
    let panel: HTMLElement;
    let button: HTMLElement;
    beforeEach(async () => {
        const i18n = createInstance();
        await i18n.init({ lng: "en-US", resources: { "en-US": { spaceStation: enUS } } });
        backend = new UniverseBackend(new SystemEntityBackend());
        player = Player.Default(backend);
        layer = new SpaceStationLayer(
            player,
            new EncyclopaediaGalacticaManager(),
            backend,
            new SoundPlayerMock(),
            new NotificationManagerMock(),
            i18n.t,
        );
        const mainPanel = layer.rootHtml.querySelector<HTMLElement>(".mainContainer");
        const hangarButton = layer.rootHtml.querySelector<HTMLElement>(".spaceshipButton");
        if (mainPanel === null || hangarButton === null) {
            throw new Error("Expected station service controls");
        }
        panel = mainPanel;
        button = hangarButton;
        layer.setStation(stationId, "Station", player);
    });
    afterEach(() => {
        layer.rootHtml.remove();
        vi.restoreAllMocks();
    });

    it("keeps the open service for equal universe IDs", () => {
        button.click();
        const content = panel.firstChild;
        expect(content).not.toBeNull();
        layer.setStation(
            { ...stationId, systemCoordinates: { ...stationId.systemCoordinates } },
            "Renamed station",
            player,
        );
        expect(panel.classList.contains("hidden")).toBe(false);
        expect(panel.firstChild).toBe(content);
        expect(layer.rootHtml.querySelector(".spaceStationName")?.textContent).toBe("Renamed station");
    });

    it.each(["local ID", "system coordinates"])("resets services when the station changes by %s", (change) => {
        button.click();
        const nextId =
            change === "local ID"
                ? { ...stationId, idInSystem: "another-station" }
                : { ...stationId, systemCoordinates: { ...stationId.systemCoordinates, starSectorX: 100 } };
        layer.setStation(nextId, "Other station", player);
        expect(panel.classList.contains("hidden")).toBe(true);
        expect(panel.childNodes).toHaveLength(0);
        button.click();
        expect(panel.classList.contains("hidden")).toBe(false);
        expect(panel.childNodes.length).toBeGreaterThan(0);
    });

    it("clears the selected service when reset before reopening the same station", () => {
        button.click();
        layer.reset();
        expect(panel.classList.contains("hidden")).toBe(true);
        expect(layer.rootHtml.querySelector(".spaceStationName")?.textContent).toBe("");
        layer.setStation(stationId, "Station", player);
        button.click();
        expect(panel.classList.contains("hidden")).toBe(false);
    });
    it("shows a localized error when station missions cannot be loaded", () => {
        vi.spyOn(backend, "getSystemContentModelAt").mockReturnValue(null);
        const alert = vi.spyOn(dialogModal, "alertModal").mockResolvedValue(undefined);
        const missions = layer.rootHtml.querySelector<HTMLElement>(".missionsButton");
        if (missions === null) {
            throw new Error("Expected the missions button");
        }
        missions.click();
        expect(alert).toHaveBeenCalledExactlyOnceWith(
            enUS.missionGenerationFailed,
            expect.anything(),
            expect.any(Function),
        );
        expect(panel.childNodes).toHaveLength(0);
    });
});
