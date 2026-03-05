import { defineConfig } from "vitest/config";

export default defineConfig({
    clearScreen: false,
    base: "./",
    server: {
        port: 1421,
        strictPort: true,
        open: true,
    },
    test: {
        environment: "jsdom",
    },
});
