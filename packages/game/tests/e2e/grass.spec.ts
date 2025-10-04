import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The grass playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, { scene: "grass", shotName: "baseline", flagToWait: "frozen", urlParams: { freeze: 1 } });
});
