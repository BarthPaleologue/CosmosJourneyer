import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { createInstance } from "i18next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { Player } from "@/frontend/player/player";

import { getVestaModel } from "@/modules/vesta/vesta";

import { StarMapSystemInfoRegistry } from "./starMapSystemInfoRegistry";
import { StarMapUI } from "./starMapUI";

describe("star-map module information", () => {
    let engine: NullEngine;
    let info: StarMapSystemInfoRegistry;
    let ui: StarMapUI;
    beforeEach(async () => {
        engine = new NullEngine();
        const scene = new Scene(engine);
        const backend = new UniverseBackend(new SystemEntityBackend());
        info = new StarMapSystemInfoRegistry();
        const i18n = createInstance();
        await i18n.init({ lng: "en-US", resources: {} });
        ui = new StarMapUI(scene, Player.Default(backend), backend, new SoundPlayerMock(), info, i18n.t);
    });
    afterEach(() => {
        ui.dispose();
        engine.dispose();
    });

    it("renders ordered plain-text contributions and replaces them when another system is selected", () => {
        info.register(({ system }) => system.name);
        info.register(() => null);
        info.register(({ entities }) => (entities.length > 0 ? "<strong>Station</strong>" : null));
        const { starSystem, systemEntities } = getVestaModel();

        ui.setSelectedSystem({ system: starSystem, entities: systemEntities }, null);

        expect(Array.from(ui.shortHandUISystemInfo.children, (node) => node.textContent)).toEqual([
            starSystem.name,
            "<strong>Station</strong>",
        ]);
        expect(ui.shortHandUISystemInfo.querySelector("strong")).toBeNull();
        expect(ui.shortHandUISystemInfo.hidden).toBe(false);

        const emptySystem = getLoneStarSystem().system;
        ui.setSelectedSystem({ system: emptySystem, entities: [] }, null);

        expect(ui.shortHandUISystemInfo.children).toHaveLength(1);
        expect(ui.shortHandUISystemInfo.textContent).toBe(emptySystem.name);
        expect(ui.shortHandUITitle.textContent).toBe(emptySystem.name);
    });

    it("hides the information container before selection and whenever the selected system has no contribution", () => {
        expect(ui.shortHandUISystemInfo.hidden).toBe(true);
        const emptyContent = { system: getLoneStarSystem().system, entities: [] };
        ui.setSelectedSystem(emptyContent, null);
        expect(ui.shortHandUISystemInfo.hidden).toBe(true);
        info.register(({ entities }) => (entities.length > 0 ? "Has entities" : null));
        const { starSystem, systemEntities } = getVestaModel();
        ui.setSelectedSystem({ system: starSystem, entities: systemEntities }, null);
        expect(ui.shortHandUISystemInfo.hidden).toBe(false);

        ui.setSelectedSystem(emptyContent, null);

        expect(ui.shortHandUISystemInfo.hidden).toBe(true);
        expect(ui.shortHandUISystemInfo.children).toHaveLength(0);
    });
});
