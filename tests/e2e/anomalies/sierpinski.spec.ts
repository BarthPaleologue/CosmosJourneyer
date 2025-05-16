import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Sierpinski Pyramid playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "sierpinski",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: {
            freeze: 1,
            seed: "0",
        },
    });
});
