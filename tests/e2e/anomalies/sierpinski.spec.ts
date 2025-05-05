import { test } from "@playwright/test";
import { renderAndSnap } from "../utils/renderSnap";

test("The Sierpinski Pyramid playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "sierpinski",
        shotName: "baseline",
        additionalUrlParams: {
            seed: "0"
        }
    });
});
