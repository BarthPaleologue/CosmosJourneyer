import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The landing pad playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "landingPad",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1 },
    });
});
