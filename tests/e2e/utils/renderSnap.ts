import { expect, Page } from "@playwright/test";

export async function renderAndSnap(
    page: Page,
    opts: {
        scene?: string;
        shotName: string;
        urlParams?: {
            freeze?: number;
            [key: string]: string | number;
        };
        flagToWait: string;
    }
) {
    const urlParams = new URLSearchParams();
    if (opts.scene !== undefined) urlParams.set("scene", opts.scene);
    for (const [key, value] of Object.entries(opts.urlParams ?? {})) {
        urlParams.set(key, String(value));
    }

    await page.goto(`/playground.html?${urlParams.toString()}`);

    await page.waitForSelector("#renderer", { state: "visible" });

    await page.locator(`#renderer[data-${opts.flagToWait}="1"]`).waitFor({ timeout: 30_000 });

    await expect(page.locator("#renderer")).toHaveScreenshot(`${opts.shotName}.png`, { timeout: 15_000 });
}
