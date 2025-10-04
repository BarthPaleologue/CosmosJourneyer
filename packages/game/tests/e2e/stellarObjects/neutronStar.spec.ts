import { test } from "@playwright/test";

import { renderAndSnap } from "../utils/renderSnap";

test("The neutron star playground renders correctly", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "neutronStar",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 1 },
    });
});
