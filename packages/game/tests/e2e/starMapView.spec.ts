import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The star map playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baseline",
        scene: "starMapView",
        flagToWait: "frozen",
        urlParams: { freeze: 60 },
    });
});

test("The star map playground renders correctly when targeting another system", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baselineOtherSystem",
        scene: "starMapView",
        flagToWait: "frozen",
        urlParams: {
            freeze: 60,
            systemCoordinates: encodeURIComponent(
                JSON.stringify({
                    localX: -0.1547746381977455,
                    localY: -0.4600146743282744,
                    localZ: 0.35319629770386796,
                    starSectorX: 7,
                    starSectorY: -9,
                    starSectorZ: 9,
                }),
            ),
        },
    });
});
