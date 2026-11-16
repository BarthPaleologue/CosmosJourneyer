import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { I18n } from "./i18n";

describe("game translation initialization", () => {
    let originalUrl: string;
    let label: HTMLParagraphElement;
    beforeEach(() => {
        originalUrl = window.location.href;
        label = document.createElement("p");
        label.dataset["i18n"] = "mainMenu:newJourney";
        document.body.appendChild(label);
    });
    afterEach(() => {
        label.remove();
        window.history.replaceState(null, "", originalUrl);
    });

    it.each([
        { language: "en-US", expected: "New Journey" },
        { language: "fr-FR", expected: "Nouveau Voyage" },
        { language: "zz-ZZ", expected: "New Journey" },
    ])("initializes $language and translates static page content", async ({ language, expected }) => {
        window.history.replaceState(null, "", `?lang=${language}`);

        const i18n = await I18n.New();

        expect(i18n.getT()("mainMenu:newJourney")).toBe(expected);
        expect(label.textContent).toBe(expected);
    });

    it("returns independent instances whose translators follow their own language", async () => {
        window.history.replaceState(null, "", "?lang=en-US");
        const first = await I18n.New();
        const second = await I18n.New();

        await first.changeLanguage("fr-FR");

        expect(first.getT()("mainMenu:newJourney")).toBe("Nouveau Voyage");
        expect(second.getT()("mainMenu:newJourney")).toBe("New Journey");
    });
});
