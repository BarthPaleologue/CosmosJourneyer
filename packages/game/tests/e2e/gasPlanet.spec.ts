import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The gas planet playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baseline",
        scene: "gasPlanet",
        flagToWait: "frozen",
        urlParams: { seed: "0", freeze: 1 },
    });
});
