import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Saturn playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baseline",
        scene: "saturn",
        flagToWait: "frozen",
        urlParams: { seed: "0", freeze: 1 },
    });
});
