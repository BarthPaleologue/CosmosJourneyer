import { test } from "@playwright/test";
import { renderAndSnap } from "./utils/renderSnap";

test("The asteroid field playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, { scene: "asteroidField", shotName: "baseline" });
});
