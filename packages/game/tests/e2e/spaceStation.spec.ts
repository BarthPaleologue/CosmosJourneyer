import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The space station playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "spaceStation",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1, seed: 5 },
    });
});

test("The space station playground has correct physics", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "spaceStation",
        shotName: "baseline-physics",
        flagToWait: "frozen",
        urlParams: { physicsViewer: "", freeze: 3, seed: 5 },
    });
});
