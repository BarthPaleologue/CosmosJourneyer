import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The star map playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "baseline",
        scene: "starMap",
        flagToWait: "frozen",
        urlParams: { freeze: 3 },
    });
});
