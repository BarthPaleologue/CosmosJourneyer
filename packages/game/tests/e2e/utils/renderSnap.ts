import { expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

type ScreenshotOptions = Parameters<ReturnType<typeof expect<Locator>>["toHaveScreenshot"]>[0];

/**
 * Waits for scene readiness before comparing the canvas to its baseline.
 * @param page - Playground browser page.
 * @param opts - Capture settings.
 * @param opts.scene - Optional scene key.
 * @param opts.shotName - Baseline filename without extension.
 * @param opts.urlParams - Extra URL parameters.
 * @param opts.urlParams.freeze - Simulation freeze time.
 * @param opts.flagToWait - Canvas data attribute set to 1 when ready.
 * @param opts.screenshotOptions - Options forwarded to Playwright's screenshot assertion.
 */
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
        screenshotOptions?: ScreenshotOptions;
    },
): Promise<void> {
    const urlParams = new URLSearchParams();
    if (opts.scene !== undefined) {
        urlParams.set("scene", opts.scene);
    }
    for (const [key, value] of Object.entries(opts.urlParams ?? {})) {
        urlParams.set(key, String(value));
    }

    await page.goto(`/playground.html?${urlParams.toString()}`);

    await page.waitForSelector("canvas", { state: "visible" });

    await page.locator(`canvas[data-${opts.flagToWait}="1"]`).waitFor({ timeout: 60_000 });

    await expect(page.locator("canvas")).toHaveScreenshot(`${opts.shotName}.png`, {
        timeout: 60_000,
        ...opts.screenshotOptions,
    });
}
