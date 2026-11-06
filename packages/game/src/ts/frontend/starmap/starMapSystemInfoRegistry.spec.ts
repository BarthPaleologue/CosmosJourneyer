import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { createInstance } from "i18next";
import { describe, expect, it } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { SoundPlayerMock } from "@/frontend/audio/soundPlayer";
import { createGameModuleApi } from "@/frontend/createGameModuleApi";
import { Player } from "@/frontend/player/player";
import { SystemEntityLoader } from "@/frontend/systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "@/frontend/systemEntity/systemEntityProcessors";

import { StarMapSystemInfoRegistry } from "./starMapSystemInfoRegistry";
import { StarMapUI } from "./starMapUI";

describe("star-map system information", () => {
    it("renders module contributions for model-only systems and replaces them on selection", async () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        const backend = new UniverseBackend(new SystemEntityBackend());
        const processors = new SystemEntityProcessors();
        const info = new StarMapSystemInfoRegistry();
        const api = createGameModuleApi(backend, new SystemEntityLoader(), processors, info);
        api.starMapSystemInfo.register(({ system }) => system.name);
        api.starMapSystemInfo.register(() => null);
        api.starMapSystemInfo.register(({ entities }) => (entities.length > 0 ? "<strong>Station</strong>" : null));
        const i18n = createInstance();
        await i18n.init({ lng: "en-US", resources: {} });
        const ui = new StarMapUI(scene, Player.Default(backend), backend, new SoundPlayerMock(), info, i18n.t);
        const content = getLoneStarSystem();
        try {
            ui.setSelectedSystem(content, null);
            expect(Array.from(ui.shortHandUISystemInfo.children, (node) => node.textContent)).toEqual([
                content.system.name,
                "<strong>Station</strong>",
            ]);
            expect(ui.shortHandUISystemInfo.querySelector("strong")).toBeNull();

            ui.setSelectedSystem({ system: { ...content.system, name: "Empty" }, entities: [] }, null);
            expect(ui.shortHandUISystemInfo.textContent).toBe("Empty");
        } finally {
            ui.htmlRoot.remove();
            processors.dispose();
            scene.dispose();
            engine.dispose();
        }
    });

    it("keeps contributions within the game instance that registered them", () => {
        const first = new StarMapSystemInfoRegistry();
        const second = new StarMapSystemInfoRegistry();
        const content = getLoneStarSystem();
        first.register(() => "Only the first game");
        expect(first.getInfo(content)).toEqual(["Only the first game"]);
        expect(second.getInfo(content)).toEqual([]);
    });
});
