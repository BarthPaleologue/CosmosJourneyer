import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SystemEntityBackend } from "@/backend/systemEntity/systemEntityBackend";
import { getLoneStarSystem } from "@/backend/universe/customSystems/loneStar";
import { UniverseBackend } from "@/backend/universe/universeBackend";

import { I18n } from "@/i18n";
import type { GameModule } from "@/modules/gameModule";
import type { GameModuleApi } from "@/modules/gameModuleApi";
import { setupModules } from "@/modules/moduleLoader";

import { ModuleAssetRegistry } from "./assets/moduleAssetRegistry";
import { createGameModuleApi } from "./createGameModuleApi";
import { StarMapSystemInfoRegistry } from "./starmap/starMapSystemInfoRegistry";
import { SystemEntityLoader } from "./systemEntity/systemEntityLoader";
import { SystemEntityProcessors } from "./systemEntity/systemEntityProcessors";

describe("module localization", () => {
    let translations: I18n;
    let originalUrl: string;
    let api: GameModuleApi;
    let info: StarMapSystemInfoRegistry;
    let processors: SystemEntityProcessors;
    beforeEach(async () => {
        originalUrl = window.location.href;
        window.history.replaceState(null, "", "?lang=en-US");
        translations = await I18n.New();
        info = new StarMapSystemInfoRegistry();
        processors = new SystemEntityProcessors();
        api = createGameModuleApi(
            new UniverseBackend(new SystemEntityBackend()),
            new SystemEntityLoader(),
            processors,
            new ModuleAssetRegistry(),
            info,
            translations,
        );
    });
    afterEach(() => {
        processors.dispose();
        window.history.replaceState(null, "", originalUrl);
    });

    it("registers translations during setup on the shared API without collisions with other modules or core", () => {
        const initialized: Array<{ api: GameModuleApi; label: string }> = [];
        const modules = ["mainMenu", "beta"].map((id): GameModule => ({
            id,
            setup: (gameApi) => {
                const t = gameApi.i18n.registerLocales(id, { "en-US": { newJourney: id } });
                initialized.push({ api: gameApi, label: t("newJourney") });
                gameApi.starMapSystemInfo.register(() => t("newJourney"));
            },
        }));

        expect(setupModules(modules, api).success).toBe(true);
        expect(initialized.map(({ label }) => label)).toEqual(["mainMenu", "beta"]);
        for (const entry of initialized) {
            expect(entry.api).toBe(api);
        }
        expect(info.getInfo({ system: getLoneStarSystem(), entities: [] })).toEqual(["mainMenu", "beta"]);
        expect(translations.getT()("mainMenu:newJourney")).toBe("New Journey");
    });

    it("keeps registered translators current after language changes, with fallback, interpolation and plurals", async () => {
        const alphaId = "alpha";
        const betaId = "beta";
        const modules: Array<GameModule> = [
            {
                id: alphaId,
                setup: (gameApi) => {
                    const t = gameApi.i18n.registerLocales(alphaId, {
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
                    gameApi.starMapSystemInfo.register(
                        ({ system }) => `${t("status")}: ${t("stations", { count: 2, name: system.name })}`,
                    );
                    gameApi.starMapSystemInfo.register(({ system }) => t("stations", { count: 1, name: system.name }));
                },
            },
            {
                id: betaId,
                setup: (gameApi) => {
                    const t = gameApi.i18n.registerLocales(betaId, { "en-US": { status: "Beta" } });
                    gameApi.starMapSystemInfo.register(() => t("status"));
                },
            },
        ];
        const content = { system: getLoneStarSystem(), entities: [] };
        expect(setupModules(modules, api).success).toBe(true);
        expect(info.getInfo(content)).toEqual([
            `Alpha: 2 stations in ${content.system.name}`,
            `1 station in ${content.system.name}`,
            "Beta",
        ]);

        await translations.changeLanguage("fr-FR");

        expect(info.getInfo(content)).toEqual([
            `Alpha FR: 2 stations dans ${content.system.name}`,
            `1 station dans ${content.system.name}`,
            "Beta",
        ]);
        expect(translations.getT()("mainMenu:newJourney")).toBe("Nouveau Voyage");
    });

    it("keeps the same module ID independent between game instances", async () => {
        const secondTranslations = await I18n.New();
        const secondProcessors = new SystemEntityProcessors();
        const secondInfo = new StarMapSystemInfoRegistry();
        const secondApi = createGameModuleApi(
            new UniverseBackend(new SystemEntityBackend()),
            new SystemEntityLoader(),
            secondProcessors,
            new ModuleAssetRegistry(),
            secondInfo,
            secondTranslations,
        );
        const id = "alpha";
        const firstModule: GameModule = {
            id,
            setup: (gameApi) => {
                const t = gameApi.i18n.registerLocales(id, { "en-US": { status: "First game" } });
                gameApi.starMapSystemInfo.register(() => t("status"));
            },
        };
        const secondModule: GameModule = {
            id,
            setup: (gameApi) => {
                const t = gameApi.i18n.registerLocales(id, { "en-US": { status: "Second game" } });
                gameApi.starMapSystemInfo.register(() => t("status"));
            },
        };
        try {
            expect(setupModules([firstModule], api).success).toBe(true);
            expect(setupModules([secondModule], secondApi).success).toBe(true);

            const content = { system: getLoneStarSystem(), entities: [] };
            expect(info.getInfo(content)).toEqual(["First game"]);
            expect(secondInfo.getInfo(content)).toEqual(["Second game"]);
        } finally {
            secondProcessors.dispose();
        }
    });

    it("loads modules that need no translations with the same setup signature", () => {
        const setup = vi.fn();
        expect(setupModules([{ id: "no-locales", setup }], api).success).toBe(true);
        expect(setup).toHaveBeenCalledExactlyOnceWith(api);
    });

    it("reports the failing module and stops loading later modules", () => {
        const laterSetup = vi.fn();
        const result = setupModules(
            [
                {
                    id: "broken",
                    setup: () => {
                        throw new Error("Setup failed");
                    },
                },
                { id: "later", setup: laterSetup },
            ],
            api,
        );

        expect(result.success).toBe(false);
        if (result.success) {
            throw new Error("Expected module setup to fail");
        }
        expect(result.error.message).toBe('Could not setup module "broken"');
        expect(laterSetup).not.toHaveBeenCalled();
    });
});
