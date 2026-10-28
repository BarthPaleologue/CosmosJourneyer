import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The rover playground starts behind the rover", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "rover",
        shotName: "default-behind",
        flagToWait: "frozen",
        screenshotOptions: { maxDiffPixelRatio: 0.001 },
        urlParams: { freeze: 5 },
    });
});

for (const view of [
    { name: "front-quarter", alpha: (3 * Math.PI) / 4 },
    { name: "rear-quarter", alpha: -Math.PI / 4 },
]) {
    test(`The rover canopy renders correctly from the ${view.name} view`, async ({ page }) => {
        await renderAndSnap(page, {
            scene: "rover",
            shotName: view.name,
            flagToWait: "frozen",
            screenshotOptions: { maxDiffPixelRatio: 0.001 },
            urlParams: { freeze: 5, cameraAlpha: view.alpha, cameraBeta: 1.4, cameraRadius: 12 },
        });
    });
}
