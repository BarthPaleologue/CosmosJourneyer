import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The aurora playground renders its first frame correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "aurora",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1 },
    });
});
