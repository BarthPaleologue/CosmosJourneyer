import { expect, test } from "@playwright/test";

test.use({
    screenshot: "only-on-failure",
});

test("The main menu renders after loading the game", async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
        if (message.type() === "error" || /INVALID_|OUT_OF_MEMORY/.test(message.text())) {
            errors.push(message.text());
        }
    });
    page.on("download", (download) => errors.push(`Unexpected download: ${download.suggestedFilename()}`));

    await page.goto("/?lang=en-US");
    await page.waitForFunction(() => Object.hasOwn(window, "CosmosJourneyer"));

    await expect(page.locator("#babylonjsLoadingDiv")).toBeHidden({ timeout: 120_000 });
    await expect(page.locator(".mainMenu")).toBeVisible();
    await expect(page.locator(".mainMenu").getByText("New Journey", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);

    const activeMeshCount = await Promise.race([
        page.waitForEvent("pageerror").then((error) => {
            throw error;
        }),
        page.evaluate(async () => {
            const { engine, starSystemView } = window.CosmosJourneyer;
            const scene = starSystemView.getMainScene();
            return await new Promise<number>((resolve) => {
                scene.onAfterRenderObservable.addOnce(() => {
                    engine.onEndFrameObservable.addOnce(() => {
                        resolve(scene.getActiveMeshes().length);
                    });
                });
            });
        }),
    ]);
    expect(activeMeshCount).toBeGreaterThan(0);

    await testInfo.attach("main-menu-first-frame", {
        body: await page.screenshot({ path: testInfo.outputPath("main-menu-first-frame.png") }),
        contentType: "image/png",
    });
    expect(errors).toEqual([]);
});
