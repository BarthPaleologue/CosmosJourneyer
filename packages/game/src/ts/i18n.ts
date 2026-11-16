//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.

import type { DeepReadonly } from "@cosmos-journeyer/typescript";
import { createInstance } from "i18next";
import type { Resource, ResourceKey, ResourceLanguage, TFunction, i18n } from "i18next";
import { z } from "zod";

import type { I18nExtensionPoint, ModuleLocales } from "./modules/i18n";
import { renderMarkdownInline } from "./utils/markdown";

/**
 * Locales are bundled eagerly so translations need no runtime fetch.
 * @returns Translation namespaces grouped by language.
 */
function loadResources(): Resource {
    const localeModules = import.meta.glob("../locales/**/*.json", {
        eager: true,
        import: "default",
    });
    const resources: Resource = {}; // { "en-US": { "notifications": { ... } }, "es-ES": { "notifications": { ... } } }

    const jsonSchema = z.record(z.string(), z.string());

    Object.entries(localeModules).forEach(([key, moduleContent]) => {
        const localePath = key.replace(/^.*\/locales\//, "");
        const parts = localePath.split("/");
        const languageFolder = parts[0]; // (en-US/notifications.json) => en-US
        if (languageFolder === undefined) {
            throw new Error("Language folder is undefined: some json files are at root level in the locales folder");
        }

        const subFolders: string[] = parts.slice(1, parts.length - 1); // (en-US/subFolder/subSubFolder/notifications.json) => ["subFolder", "subSubFolder"]
        const fileName = parts.at(-1); // (./en-US/notifications.json) => notifications.json
        if (fileName === undefined) {
            throw new Error("File name is undefined");
        }

        const nameSpace = fileName.split(".")[0]; // (./en-US/notifications.json) => notifications
        if (nameSpace === undefined) {
            throw new Error(`Could not split file name from extension: ${fileName}`);
        }

        resources[languageFolder] = resources[languageFolder] ?? {};
        let currentResource: ResourceLanguage | ResourceKey = resources[languageFolder];
        subFolders.forEach((subFolder) => {
            if (typeof currentResource === "string") {
                throw new Error("Encountered recursion error when iterating locale subfolders!");
            }
            if (!(subFolder in currentResource)) {
                currentResource[subFolder] = {} as ResourceLanguage;
            }
            currentResource = currentResource[subFolder] as ResourceLanguage;
        });

        const fileContent = jsonSchema.parse(moduleContent);
        currentResource[nameSpace] = fileContent;
    });

    return resources;
}

export class I18n implements I18nExtensionPoint {
    private readonly instance: i18n;

    private constructor(instance: i18n) {
        this.instance = instance;
    }

    /**
     * Uses the URL language override, falling back to the browser language.
     * @returns Initialized translation service after applying static page translations.
     */
    public static async New(): Promise<I18n> {
        const urlParams = new URLSearchParams(window.location.search);
        const language = urlParams.get("lang") ?? navigator.language;
        const instance = createInstance();
        await instance.init({
            lng: language,
            debug: import.meta.env.DEV,
            fallbackLng: "en-US",
            resources: loadResources(),
        });
        const service = new I18n(instance);
        const t = service.getT();
        document.querySelectorAll("*[data-i18n]").forEach((element) => {
            const key = element.getAttribute("data-i18n");
            if (key === null) {
                throw new Error("data-i18n attribute is null");
            }
            element.innerHTML = renderMarkdownInline(t(key));
        });
        return service;
    }

    /** @returns Translator for the game's core namespaces and current language. */
    public getT(): TFunction {
        return this.instance.t;
    }

    public registerLocales(moduleId: string, locales: DeepReadonly<ModuleLocales>): TFunction {
        const namespace = `module/${moduleId}`;
        for (const [language, translations] of Object.entries(locales)) {
            this.instance.addResourceBundle(language, namespace, translations);
        }
        return this.instance.getFixedT(null, namespace);
    }

    /** @param language Language code, with fallback to the bundled English resources. */
    public async changeLanguage(language: string): Promise<void> {
        await this.instance.changeLanguage(language);
    }
}
