import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The i18n should be correctly initialized", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "tutorial",
        shotName: "baseline",
        flagToWait: "ready",
        urlParams: { lang: "en-US" },
    });
});
