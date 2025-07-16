import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Moon playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baseline",
        scene: "moon",
        flagToWait: "frozen",
        urlParams: { seed: "0", freeze: 1, light: "" },
    });
});
