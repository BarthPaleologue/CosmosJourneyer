import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The rings playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "rings",
        shotName: "baseline",
        urlParams: {
            seed: 0,
        },
        flagToWait: "ready",
    });
});
