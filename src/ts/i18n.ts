import i18next, { Resource, init, t, ResourceKey, ResourceLanguage } from "i18next";

/**
 * Load all the resources from the locales folder and return them in the i18next format.
 * This takes place at build time, so the resources are bundled with the application.
 */
function loadResources() {
    const requireContext = require.context("../locales/", true, /\.json$/);
    const resources: Resource = {}; // { "en-US": { "notifications": { ... } }, "es-ES": { "notifications": { ... } } }

    requireContext.keys().forEach((key: string) => {
        const parts = key.split("/");
        const languageFolder = parts[1]; // (./en-US/notifications.json) => en-US
        const subFolders: string[] = parts.slice(2, parts.length - 1); // (./en-US/subFolder/subSubFolder/notifications.json) => ["subFolder", "subSubFolder"]
        const nameSpace = parts[parts.length - 1].split(".")[0]; // (./en-US/notifications.json) => notifications
        const fileContent = requireContext(key);

        resources[languageFolder] = resources[languageFolder] || {};
        let currentResource: ResourceLanguage | ResourceKey = resources[languageFolder];
        subFolders.forEach((subFolder) => {
            if (typeof currentResource === "string") {
                throw new Error("Encountered recursion error when iterating locale subfolders!");
            }
            currentResource[subFolder] = currentResource[subFolder] || {};
            currentResource = currentResource[subFolder];
        });
        currentResource[nameSpace] = fileContent;
    });

    return resources;
}

export async function initI18n() {
    // init language to url parameter if defined, otherwise use the browser language
    const urlParams = new URLSearchParams(window.location.search);
    const language = urlParams.get("lang") || navigator.language;

    await init({
        lng: language, // change this if you want to test a specific language
        debug: process.env.NODE_ENV === "development",
        fallbackLng: "en-US",
        resources: loadResources()
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
