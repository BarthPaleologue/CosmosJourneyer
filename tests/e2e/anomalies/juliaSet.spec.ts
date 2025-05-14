import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Julia Set playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "juliaSet",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: {
            freeze: 1,
            seed: "0",
        },
    });
});
