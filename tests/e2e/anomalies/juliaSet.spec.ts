import { test } from "@playwright/test";
import { renderAndSnap } from "../utils/renderSnap";

test("The Julia Set playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "juliaSet",
        shotName: "baseline",
        additionalUrlParams: {
            seed: "0"
        }
    });
});
