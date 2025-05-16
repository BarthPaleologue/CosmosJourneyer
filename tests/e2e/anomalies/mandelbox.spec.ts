import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Mandelbox playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "mandelbox",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: {
            freeze: 1,
            seed: "0",
        },
    });
});
