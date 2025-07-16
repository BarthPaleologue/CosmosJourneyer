import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "tests/e2e",
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
                "--use-webgpu-adapter=swiftshader",
                "--use-gpu-in-tests",
            ],
        },
        viewport: { width: 1280, height: 720 },
    },
    timeout: 5 * 60 * 1000, // 5 minutes
    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.03,
            threshold: 0.01,
        },
    },
    webServer: {
        command: "npm run serve:prod",
        url: "http://localhost:8080",
        reuseExistingServer: process.env["CI"] === undefined,
    },
});
