import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The lens flare playground renders with the lens flare not occluded", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "lensFlareOcclusion",
        shotName: "not-occluded",
        flagToWait: "lens-flare-occlusion-ready",
        urlParams: { occlusion: "not-occluded" },
    });
});

test("The lens flare playground renders with the lens flare partially occluded", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "lensFlareOcclusion",
        shotName: "partially-occluded",
        flagToWait: "lens-flare-occlusion-ready",
        urlParams: { occlusion: "partially-occluded" },
    });
});

test("The lens flare playground renders with the lens flare occluded", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "lensFlareOcclusion",
        shotName: "occluded",
        flagToWait: "lens-flare-occlusion-ready",
        urlParams: { occlusion: "occluded" },
    });
});
