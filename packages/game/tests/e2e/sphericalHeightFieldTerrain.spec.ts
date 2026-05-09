import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The spherical height field terrain playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "render-baseline",
        scene: "sphericalHeightFieldTerrain",
        flagToWait: "frozen",
        urlParams: { seed: "261", freeze: 1 },
    });
});

test("The spherical height field terrain playground physics are correct", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "physics-baseline",
        scene: "sphericalHeightFieldTerrain",
        flagToWait: "frozen",
        urlParams: { seed: "261", freeze: 10, physicsViewer: "", startingDistance: 1136.5e3 },
    });
});
