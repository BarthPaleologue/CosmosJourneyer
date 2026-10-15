import { expect, test } from "@playwright/test";

for (const view of ["overview", "mirror", "shields"]) {
    test(`Space telescope renders its ${view} view with thin instances and shadows`, async ({ page }, testInfo) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (message.type() === "error") {
                errors.push(message.text());
            }
        });
        await page.goto(`/playground.html?scene=spaceTelescope&view=${view}&freeze=3`);
        await page.locator('canvas[data-frozen="1"]').waitFor({ timeout: 90_000 });
        await page.locator("#babylonjsLoadingDiv").waitFor({ state: "detached" });
        const rendering = await page.evaluate(() => {
            const scene = window.scene;
            const mirror = scene.getMeshByName("primaryMirror");
            const shadows = scene.lights[0]?.getShadowGenerator();
            const shadowMap = shadows?.getShadowMap();
            const engine = scene.getEngine();
            engine._drawCalls.fetchNewFrame();
            scene.render();
            return {
                meshCount: scene.meshes.length,
                segments: mirror !== null && "thinInstanceCount" in mirror ? mirror.thinInstanceCount : 0,
                mirrorActive: mirror !== null && scene.getActiveMeshes().data.includes(mirror),
                mirrorCastsShadows: mirror !== null && (shadowMap?.renderList?.includes(mirror) ?? false),
                materialsReady: scene.materials.every((material) => material.getEffect()?.isReady() ?? true),
                drawCalls: engine._drawCalls.current,
                cascades:
                    shadows !== null && shadows !== undefined && "numCascades" in shadows ? shadows.numCascades : 0,
            };
        });
        await page.screenshot({ path: testInfo.outputPath(`${view}.png`) });
        expect(rendering.meshCount).toBe(34); // Telescope and environment skybox.
        expect(rendering.segments).toBe(720);
        expect(rendering.mirrorCastsShadows).toBe(true);
        expect(rendering.materialsReady).toBe(true);
        if (view !== "shields") {
            expect(rendering.mirrorActive).toBe(true);
        }
        expect(rendering.cascades).toBe(4);
        // Four shadow cascades, the depth pass and its reduction add draws to the main pass.
        expect(rendering.drawCalls).toBeLessThan(220);
        expect(errors).toEqual([]);
        console.log(`${view}: ${JSON.stringify(rendering)}`);
    });
}

test("Vesta loads its authored telescope alongside the monolith", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/playground.html?scene=customSystem&system=vesta&freeze=3");
    await page.locator('canvas[data-frozen="1"]').waitFor({ timeout: 120_000 });
    const content = await page.evaluate(() => {
        const scene = window.scene;
        const roots = scene.transformNodes.filter((node) => node.name === "spaceTelescope");
        return {
            telescopeCount: roots.length,
            placementName: roots[0]?.parent?.name,
            position: roots[0]?.getAbsolutePosition().asArray(),
            hasMonolith: scene.getMeshByName("Monolith") !== null,
        };
    });
    expect(content.telescopeCount).toBe(1);
    expect(content.placementName).toBe("vestaSpaceTelescope_in_orbit_placement");
    expect(content.hasMonolith).toBe(true);
    expect(content.position?.every(Number.isFinite)).toBe(true);
    expect(errors).toEqual([]);
});

test("Space telescope remains visible when its parent is translated to 30 AU", async ({ page }, testInfo) => {
    await page.goto("/playground.html?scene=spaceTelescope&view=mirror&freeze=3");
    await page.locator('canvas[data-frozen="1"]').waitFor({ timeout: 90_000 });
    const rendering = await page.evaluate(() => {
        const scene = window.scene;
        const telescope = scene.getTransformNodeByName("spaceTelescope");
        const camera = scene.activeCamera;
        if (telescope === null || camera === null) {
            return undefined;
        }
        camera.parent = telescope;
        for (const light of scene.lights) {
            light.parent = telescope;
        }
        telescope.position.x = 30 * 149_597_870_700;
        scene.render();
        const mirror = scene.getMeshByName("primaryMirror");
        return {
            active: mirror !== null && scene.getActiveMeshes().data.includes(mirror),
            rootPosition: telescope.getAbsolutePosition().x,
            bounds: mirror?.getBoundingInfo().boundingBox.centerWorld.asArray(),
        };
    });
    expect(rendering?.active).toBe(true);
    expect(rendering?.rootPosition).toBe(30 * 149_597_870_700);
    expect(rendering?.bounds?.every(Number.isFinite)).toBe(true);
    await page.locator("#babylonjsLoadingDiv").waitFor({ state: "detached" });
    await page.screenshot({ path: testInfo.outputPath("30au.png") });
});

test("Vesta's telescope stays fixed near the ship while orbital time advances", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/playground.html?scene=customSystem&system=vesta&spawnAtEntity=vestaSpaceTelescope&freeze=3");
    await page.locator('canvas[data-frozen="1"]').waitFor({ timeout: 120_000 });
    const motion = await page.evaluate(() => {
        const scene = window.scene;
        const telescope = scene.getTransformNodeByName("spaceTelescope");
        const camera = scene.activeCamera;
        if (telescope === null || camera === null) {
            return undefined;
        }
        const initial = telescope.getAbsolutePosition().clone();
        const initialOrientation = telescope.absoluteRotationQuaternion.clone();
        scene.getEngine().getDeltaTime = () => 1000 / 60;
        for (let i = 0; i < 30; i++) {
            scene.render();
        }
        const final = telescope.getAbsolutePosition();
        return {
            distance: final.subtract(camera.globalPosition).length(),
            drift: final.subtract(initial).length(),
            sameOrientation: telescope.absoluteRotationQuaternion.equalsWithEpsilon(initialOrientation, 1e-6),
        };
    });
    expect(motion?.distance).toBeLessThan(1000);
    expect(motion?.drift).toBeLessThan(0.01);
    expect(motion?.sameOrientation).toBe(true);
    expect(errors).toEqual([]);
});
