import { createInstance } from "i18next";
import { expect, it } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import type { GameModule } from "@/modules/gameModule";
import { setupModules } from "@/modules/moduleLoader";

import { createGameModuleApi } from "./createGameModuleApi";
import { StarMapSystemInfoRegistry } from "./starmap/starMapSystemInfoRegistry";
import { SystemEntityLoader } from "./systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "./systemEntity/systemEntityProcessors";

it("scopes module resources and translators by ID while preserving language fallback and interpolation", async () => {
    const i18n = createInstance();
    await i18n.init({
        lng: "en-US",
        fallbackLng: "en-US",
        resources: { "en-US": { translation: { status: "Core status" } } },
    });
    const info = new StarMapSystemInfoRegistry();
    const processors = new SystemEntityProcessors();
    const createApi = createGameModuleApi(
        new UniverseBackend(new SystemEntityBackend()),
        new SystemEntityLoader(),
        processors,
        info,
        i18n,
    );
    const modules: Array<GameModule> = [
        {
            id: "alpha",
            setup: ({ i18n: moduleI18n, starMapSystemInfo }) => {
                moduleI18n.registerResources({
                    "en-US": {
                        status: "Alpha",
                        stations_one: "{{count}} station in {{name}}",
                        stations_other: "{{count}} stations in {{name}}",
                    },
                    "fr-FR": {
                        status: "Alpha FR",
                        stations_one: "{{count}} station dans {{name}}",
                        stations_other: "{{count}} stations dans {{name}}",
                    },
                });
                starMapSystemInfo.register(
                    ({ system }) =>
                        `${moduleI18n.t("status")}: ${moduleI18n.t("stations", { count: 2, name: system.name })}`,
                );
            },
        },
        {
            id: "beta",
            setup: ({ i18n: moduleI18n, starMapSystemInfo }) => {
                moduleI18n.registerResources({ "en-US": { status: "Beta" } });
                starMapSystemInfo.register(() => moduleI18n.t("status"));
            },
        },
    ];
    try {
        expect(setupModules(modules, createApi).success).toBe(true);
        const content = getLoneStarSystem();
        expect(info.getInfo(content)).toEqual([`Alpha: 2 stations in ${content.system.name}`, "Beta"]);
        expect(createApi("alpha").i18n.t("stations", { count: 1, name: content.system.name })).toBe(
            `1 station in ${content.system.name}`,
        );
        expect(i18n.t("status")).toBe("Core status");

        await i18n.changeLanguage("fr-FR");
        expect(info.getInfo(content)).toEqual([`Alpha FR: 2 stations dans ${content.system.name}`, "Beta"]);
        expect(i18n.t("status")).toBe("Core status");
    } finally {
        processors.dispose();
    }
});
