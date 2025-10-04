import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The black hole playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "blackHole",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1 },
    });
});
