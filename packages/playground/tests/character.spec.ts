import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

test("The character playground renders correctly from 3rd person view", async ({ page }) => {
    await renderAndSnap(page, {
        scene: "character",
        shotName: "baseline",
        flagToWait: "frozen",
        urlParams: { freeze: 4, thirdPerson: "" },
    });
});
