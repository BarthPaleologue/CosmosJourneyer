import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The debug assets playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "debugAssets",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1 },
    });
});
