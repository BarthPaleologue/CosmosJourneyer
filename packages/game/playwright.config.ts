import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "tests/e2e",
    timeout: 180_000,
    workers: 1,
    use: {
        baseURL: "http://localhost:8080",
        browserName: "chromium",
        headless: true,
        launchOptions: {
            args: [
                "--no-sandbox",
                "--headless=new",
                "--enable-unsafe-webgpu",
                "--enable-features=Vulkan",
                "--use-angle=vulkan",
                "--use-vulkan=swiftshader",
                "--disable-vulkan-surface",
                "--use-webgpu-adapter=swiftshader",
                "--use-gpu-in-tests",
            ],
        },
        viewport: { width: 1280, height: 720 },
    },

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.02,
            threshold: 0.01,
        },
    },

    webServer: {
        command: "pnpm serve:prod",
        url: "http://localhost:8080",
        reuseExistingServer: process.env["CI"] === undefined,
    },
});
