import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The asteroid field playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "asteroidField",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 3 },
    });
});

test("The asteroid field playground has correct physics", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "asteroidField",
        shotName: "baseline-physics",
        flagToWait: "frozen",
        urlParams: { physicsViewer: "", freeze: 3 },
    });
});
