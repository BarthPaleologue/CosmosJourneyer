import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Mars playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baseline",
        scene: "mars",
        flagToWait: "frozen",
        urlParams: { seed: "0", freeze: 1, light: "" },
    });
});
