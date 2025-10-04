import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Sun playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baseline",
        scene: "sun",
        flagToWait: "frozen",
        urlParams: { freeze: 2 },
    });
});
