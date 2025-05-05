import { test } from "@playwright/test";
import { renderAndSnap } from "../utils/renderSnap";

test("The Mandelbulb playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "mandelbulb",
        shotName: "baseline",
        additionalUrlParams: {
            seed: "0"
        }
    });
});
