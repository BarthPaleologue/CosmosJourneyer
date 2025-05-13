import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The i18n should be correctly initialized", async ({ page }) => {
    await renderAndSnap(page, { scene: "tutorial", shotName: "baseline", additionalUrlParams: { lang: "en-US" } });
});
