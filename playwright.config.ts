import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "tests/e2e",
    retries: process.env.CI ? 2 : 0,
    use: {
        baseURL: "http://localhost:8080",
        browserName: "chromium",
        headless: true,
        launchOptions: {
            args: [
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--use-gl=swiftshader" // software WebGL
            ]
        },
        viewport: { width: 1280, height: 720 }
    },

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.03 // ~3 % pixels may differ
        }
    },

    webServer: {
        command: "npm run serve:prod",
        url: "http://localhost:8080",
        reuseExistingServer: !process.env.CI
    }
});
