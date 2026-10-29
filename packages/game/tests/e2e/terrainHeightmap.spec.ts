import { expect, test } from "@playwright/test";

for (const seed of [261, 960]) {
    test(`The terrain heightmap is continuous and renders correctly for seed ${seed}`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (message.type() === "error") {
                errors.push(message.text());
            }
        });
        await page.goto(`/playground.html?scene=terrainHeightmap&seed=${seed}`);
        await expect(page.locator("#babylonjsLoadingDiv")).toBeHidden({ timeout: 60_000 });
        await expect(page.locator("#terrain-heightmap")).toHaveScreenshot(`seed-${seed}.png`);
        const samples = await page.evaluate(() => {
            const { width, height, heights } = window.terrainHeightmap;
            const heightAt = (index: number): number => {
                const value = heights[index];
                if (value === undefined) {
                    throw new Error(`Missing terrain height at ${index}`);
                }
                return value;
            };
            let seamError = 0;
            let poleError = 0;
            for (let y = 0; y < height; y++) {
                seamError = Math.max(seamError, Math.abs(heightAt(y * width) - heightAt((y + 1) * width - 1)));
            }
            for (let x = 0; x < width; x++) {
                poleError = Math.max(
                    poleError,
                    Math.abs(heightAt(x) - heightAt(0)),
                    Math.abs(heightAt((height - 1) * width + x) - heightAt((height - 1) * width)),
                );
            }
            return {
                finite: heights.every(Number.isFinite),
                range:
                    heights.reduce((max, value) => Math.max(max, value), -Infinity) -
                    heights.reduce((min, value) => Math.min(min, value), Infinity),
                seamError,
                poleError,
            };
        });
        expect(errors).toEqual([]);
        expect(samples.finite).toBe(true);
        expect(samples.range).toBeGreaterThan(100);
        // Float32 spherical coordinates differ slightly at ±π and at the poles.
        expect(samples.seamError).toBeLessThan(5);
        expect(samples.poleError).toBeLessThan(5);
    });
}
