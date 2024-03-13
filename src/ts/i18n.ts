import i18next, { Resource, init } from "i18next";

/**
 * Load all the resources from the locales folder and return them in the i18next format.
 * This takes place at build time, so the resources are bundled with the application.
 */
function loadResources() {
    const requireContext = require.context("../locales/", true, /\.json$/);
    const resources: Resource = {}; // { "en-US": { "notifications": { ... } }, "es-ES": { "notifications": { ... } } }

    requireContext.keys().forEach((key: string) => {
        const languageFolder = key.split("/")[1]; // (./en-US/notifications.json) => en-US
        const nameSpace = key.split("/")[2].split(".")[0]; // (./en-US/notifications.json) => notifications
        const fileContent = requireContext(key);

        resources[languageFolder] = resources[languageFolder] || {};
        resources[languageFolder][nameSpace] = fileContent;
    });

    return resources;
}

// init language to url parameter if defined, otherwise use the browser language
const urlParams = new URLSearchParams(window.location.search);
const language = urlParams.get("lang") || navigator.language;

await init({
    lng: language, // change this if you want to test a specific language
    debug: true,
    fallbackLng: "en-US",
    resources: loadResources()
});

export default i18next;
