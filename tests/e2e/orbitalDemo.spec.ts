import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The orbital demo playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "orbitalDemo",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1 },
    });
});
