import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        include: ["src/**/*.{test,spec}.ts", "packages/**/*.{test,spec}.ts", "tests/**/*.{test,spec}.ts"],
        exclude: ["**/node_modules/**", "dist", ".git", "packages/playground/tests/**"],
    },
    plugins: [
        tsconfigPaths(),
        {
            name: "asset-loader",
            transform(code, id) {
                // Handle GLSL files
                if (id.endsWith(".glsl")) {
                    return `export default ${JSON.stringify(code)};`;
                }
                // Handle other asset files
                if (id.endsWith(".env") || id.endsWith(".dds") || id.endsWith(".babylon")) {
                    return `export default ${JSON.stringify("")};`;
                }
                return null;
            },
        },
    ],
    assetsInclude: ["**/*.glsl", "**/*.env", "**/*.dds", "**/*.babylon", "**/*.obj", "**/*.glb"],
});
