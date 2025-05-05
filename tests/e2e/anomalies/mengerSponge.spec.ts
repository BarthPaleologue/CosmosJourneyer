import { test } from "@playwright/test";
import { renderAndSnap } from "../utils/renderSnap";

test("The Menger Sponge playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "mengerSponge",
        shotName: "baseline",
        additionalUrlParams: {
            seed: "0"
        }
    });
});
