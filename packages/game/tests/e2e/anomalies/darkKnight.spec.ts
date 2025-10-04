import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The Dark knight playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "darkKnight",
        shotName: "baseline",
        flagToWait: "ready",
    });
});
