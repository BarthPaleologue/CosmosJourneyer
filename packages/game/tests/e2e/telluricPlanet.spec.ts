import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The telluric planet playground renders correctly for Earth-Like worlds", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "earth-like-baseline",
        scene: "telluricPlanet",
        flagToWait: "frozen",
        urlParams: { seed: "6", freeze: 1 },
    });
});

test("The telluric planet playground renders correctly for Desertic worlds", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "desertic-baseline",
        scene: "telluricPlanet",
        flagToWait: "frozen",
        urlParams: { seed: "18", freeze: 1 },
    });
});
