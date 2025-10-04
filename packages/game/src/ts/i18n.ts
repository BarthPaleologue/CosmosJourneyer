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

import i18next, { init, t, type Resource, type ResourceKey, type ResourceLanguage } from "i18next";
import { z } from "zod";

/**
 * Load all the resources from the locales folder and return them in the i18next format.
 * This takes place at build time, so the resources are bundled with the application.
 */
function loadResources() {
    const requireContext = require.context("../locales/", true, /\.json$/);
    const resources: Resource = {}; // { "en-US": { "notifications": { ... } }, "es-ES": { "notifications": { ... } } }

    const jsonSchema = z.record(z.string(), z.string());

    requireContext.keys().forEach((key: string) => {
        const parts = key.split("/");
        const languageFolder = parts[1]; // (./en-US/notifications.json) => en-US
        if (languageFolder === undefined) {
            throw new Error("Language folder is undefined: some json files are at root level in the locales folder");
        }

        const subFolders: string[] = parts.slice(2, parts.length - 1); // (./en-US/subFolder/subSubFolder/notifications.json) => ["subFolder", "subSubFolder"]
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

        const fileContent = jsonSchema.parse(requireContext(key));
        currentResource[nameSpace] = fileContent;
    });

    return resources;
}

export async function initI18n() {
    // init language to url parameter if defined, otherwise use the browser language
    const urlParams = new URLSearchParams(window.location.search);
    const language = urlParams.get("lang") ?? navigator.language;

    await init({
        lng: language, // change this if you want to test a specific language
        debug: process.env["NODE_ENV"] === "development",
        fallbackLng: "en-US",
        resources: loadResources(),
    });

    // perform all static translations
    document.querySelectorAll("*[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");
        if (key === null) throw new Error("data-i18n attribute is null");

        // this should be safe as we are not doing any interpolation
        // (as long as the translation are reviewed before being merged of course)
        element.innerHTML = t(key);
    });
}

export default i18next;
