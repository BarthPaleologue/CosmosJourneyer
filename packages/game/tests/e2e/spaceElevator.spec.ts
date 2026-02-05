import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The space station playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "spaceElevator",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1, seed: 9 },
    });
});

test("The space station playground has correct physics", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "spaceElevator",
        shotName: "baseline-physics",
        flagToWait: "frozen",
        urlParams: { physicsViewer: "", freeze: 3, seed: 9 },
    });
});
