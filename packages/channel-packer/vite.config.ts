import { defineConfig } from "vitest/config";

export default defineConfig({
    clearScreen: false,
    server: {
        port: 1421,
        strictPort: true,
        open: true,
    },
    test: {
        environment: "jsdom",
    },
});
