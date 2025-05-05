import { test } from "@playwright/test";
import { renderAndSnap } from "./utils/renderSnap";

test("The atmosphere playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, { scene: "atmosphericScattering", shotName: "baseline" });
});
