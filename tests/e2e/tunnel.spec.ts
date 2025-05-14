import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The tunnel playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "tunnel",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1 },
    });
});
