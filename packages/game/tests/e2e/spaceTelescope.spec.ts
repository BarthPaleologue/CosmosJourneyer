import { test } from "@playwright/test";

import { renderAndSnap } from "./utils/renderSnap";

for (const view of ["overview", "mirror", "insulation"]) {
    test(`Space telescope renders its ${view} view`, async ({ page }) => {
        await renderAndSnap(page, {
            scene: "spaceTelescope",
            shotName: view,
            flagToWait: "frozen",
            urlParams: { view, freeze: 3 },
        });
    });
}
