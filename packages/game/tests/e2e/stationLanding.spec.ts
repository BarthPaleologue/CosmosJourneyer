import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("Ship spawns facing the station", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "facing-station-baseline",
        scene: "stationLanding",
        flagToWait: "frozen",
        urlParams: { freeze: 1, seed: 5 },
    });
});

test("Ship spawnOnPad spawns the ship on the landing pad", async ({ page }) => {
    await renderAndSnap(page, {
        shotName: "spawn-on-pad-baseline",
        scene: "stationLanding",
        flagToWait: "frozen",
        urlParams: { freeze: 1, spawnOnPad: "true", seed: 5 },
    });
});
