import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The lens flare playground renders with the lens flare not occluded", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "lensFlareOcclusion",
        shotName: "not-occluded",
        flagToWait: "lens-flare-occlusion-ready",
        urlParams: { occlusion: "not-occluded" },
    });
});

test("The lens flare playground renders with the lens flare partially occluded", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "lensFlareOcclusion",
        shotName: "partially-occluded",
        flagToWait: "lens-flare-occlusion-ready",
        urlParams: { occlusion: "partially-occluded" },
    });
});

test("The lens flare playground renders with the lens flare occluded", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "lensFlareOcclusion",
        shotName: "occluded",
        flagToWait: "lens-flare-occlusion-ready",
        urlParams: { occlusion: "occluded" },
    });
});

/**
 * @param page - Playground browser page.
 * @param occlusion - Occlusion mode for the first source.
 * @param flares - Sources contributing a flare with both meshes present.
 * @returns Mean RGB intensity of a rendered frame.
 */
async function measureBrightness(
    page: Page,
    occlusion: "partially-occluded" | "occluded",
    flares: "first" | "second" | "both",
): Promise<number> {
    await page.goto(`/playground.html?scene=lensFlareOcclusion&occlusion=${occlusion}&flares=${flares}`);
    await page.locator('canvas[data-lens-flare-occlusion-ready="1"]').waitFor();

    return page.evaluate(async () => {
        const scene = window.scene;
        const engine = scene.getEngine();
        const width = engine.getRenderWidth();
        const height = engine.getRenderHeight();
        const pixels = await new Promise<ArrayBufferView>((resolve) => {
            scene.onAfterRenderObservable.addOnce(() => {
                resolve(engine.readPixels(0, 0, width, height));
            });
        });
        if (!(pixels instanceof Uint8Array)) {
            throw new Error("Expected RGBA bytes from the playground framebuffer");
        }

        let brightness = 0;
        for (let i = 0; i < pixels.length; i += 4) {
            brightness += (pixels[i] ?? 0) + (pixels[i + 1] ?? 0) + (pixels[i + 2] ?? 0);
        }
        return brightness / (width * height * 3);
    });
}

test("Two flares contribute independently when one source is occluded", async ({ page }) => {
    const first = await measureBrightness(page, "partially-occluded", "first");
    const second = await measureBrightness(page, "partially-occluded", "second");
    const both = await measureBrightness(page, "partially-occluded", "both");
    expect(both).toBeGreaterThan(first);
    expect(both).toBeGreaterThan(second);

    const visibleFlare = await measureBrightness(page, "occluded", "second");
    const bothWithFirstOccluded = await measureBrightness(page, "occluded", "both");
    expect(bothWithFirstOccluded).toBeCloseTo(visibleFlare, 1);
});
