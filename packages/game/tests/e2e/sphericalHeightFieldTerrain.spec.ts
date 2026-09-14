import { expect, test } from "@playwright/test";

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
        urlParams: { seed: "261", freeze: 10, physicsViewer: "" },
    });

    await expect
        .poll(async () => page.evaluate(() => window.scene.meshes.some((mesh) => mesh.physicsBody !== null)))
        .toBe(true);
});

test("The spherical height field terrain playground places cubes using sampled terrain heights", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "sampled-surface-cubes-baseline",
        scene: "sphericalHeightFieldTerrain",
        flagToWait: "frozen",
        urlParams: { seed: "960", freeze: 10, sampledSurfaceCubes: "" },
    });
});
