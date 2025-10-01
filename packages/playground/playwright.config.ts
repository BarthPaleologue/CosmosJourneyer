import path from "path";
import { fileURLToPath } from "url";

import { defineConfig } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    testDir: "./tests",
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
        command: "pnpm --filter @cosmos-journeyer/playground serve",
        cwd: path.resolve(__dirname, "../.."),
        url: "http://localhost:8080",
        reuseExistingServer: process.env["CI"] === undefined,
    },
});
