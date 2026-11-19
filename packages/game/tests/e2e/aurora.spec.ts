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

test("The aurora playground shows the magnetosphere gizmo with ?magnetosphere", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "aurora",
        shotName: "magnetosphere",
        flagToWait: "frozen",
        urlParams: { freeze: 1, magnetosphere: 1 },
    });
});
