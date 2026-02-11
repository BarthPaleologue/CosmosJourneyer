import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "tests/e2e",
    timeout: 180_000,
    use: {
        baseURL: "http://localhost:8080",
        browserName: "chromium",
        headless: true,
        launchOptions: {
            args: [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--use-gl=swiftshader", // software WebGL
            ],
        },
        viewport: { width: 1280, height: 720 },
    },

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.03,
            threshold: 0.01,
        },
    },

    webServer: {
        command: "pnpm serve:prod",
        url: "http://localhost:8080",
        reuseExistingServer: process.env["CI"] === undefined,
    },
});
