import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The default playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, { shotName: "default", flagToWait: "ready" });
});
