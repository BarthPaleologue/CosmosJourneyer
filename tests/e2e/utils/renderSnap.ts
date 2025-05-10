import { Page, expect } from "@playwright/test";

export async function renderAndSnap(
    page: Page,
    opts: { scene?: string; shotName: string; additionalUrlParams?: Record<string, string> }
) {
    const urlParams = new URLSearchParams();
    if (opts.scene !== undefined) urlParams.set("scene", opts.scene);
    urlParams.set("freeze", "");

    for (const [key, value] of Object.entries(opts.additionalUrlParams || {})) {
        urlParams.set(key, value);
    }

    await page.goto(`/playground.html?${urlParams.toString()}`);

    await page.waitForSelector("#renderer", { state: "visible" });
    await page.locator('#renderer[data-ready="1"]').waitFor({ timeout: 30_000 });

    await expect(page.locator("#renderer")).toHaveScreenshot(`${opts.shotName}.png`, { timeout: 15_000 });
}
