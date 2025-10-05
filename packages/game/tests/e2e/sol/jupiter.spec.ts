import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Jupiter playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baseline",
        scene: "jupiter",
        flagToWait: "frozen",
        urlParams: { seed: "0", freeze: 1 },
    });
});
