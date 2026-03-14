import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The space dots playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "spaceDots",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1 },
    });
});
