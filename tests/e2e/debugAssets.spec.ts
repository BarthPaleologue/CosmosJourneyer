import { test, expect } from "@playwright/test";

test("The debug assets playground renders correctly", async ({ page }) => {
    await page.goto("/playground.html?scene=debugAssets&freeze");

    // wait for the canvas to be visible
    await page.waitForSelector("#renderer", { state: "visible" });

    // wait for the canvas to be ready
    await page.locator('#renderer[data-ready="1"]').waitFor({ timeout: 15_000 });

    // take the visual snapshot (first run creates the baseline)
    await expect(page.locator("#renderer")).toHaveScreenshot("baseline.png", { timeout: 15_000 });
});
