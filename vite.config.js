import { defineConfig } from "vite";
import { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import vitePluginBanner from "vite-plugin-banner";
import handlebars from "vite-plugin-handlebars"; // For injecting variables into HTML templates
import glsl from "vite-plugin-glsl";

// Define a shared banner
const bannerText = `
//  This file is part of Cosmos Journeyer
//
//  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
//
//  This program is free software: you can redistribute it and/or modify
//  it under the terms of the GNU Affero General Public License as published by
//  the Free Software Foundation, either version 3 of the License, or
//  (at your option) any later version.
//
//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU Affero General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program.  If not, see <https://www.gnu.org/licenses/>.
`;

export default defineConfig(({ mode }) => {
    const isProduction = mode === "production";

    return {
        root: "src",
        base: "/", // Base path for deployment
        build: {
            outDir: resolve(__dirname, "dist"),
            sourcemap: !isProduction,
            rollupOptions: {
                input: {
                    main: resolve(__dirname, "src/ts/index.ts"),
                    alphaTestis: resolve(__dirname, "src/ts/alphaTestis.ts"),
                    blackHole: resolve(__dirname, "src/ts/blackHoleDemo.ts"),
                    playground: resolve(__dirname, "src/ts/playground.ts"),
                    xr: resolve(__dirname, "src/ts/xr.ts"),
                    spaceStationGenerator: resolve(__dirname, "src/ts/spaceStationGenerator.ts"),
                    debugAssets: resolve(__dirname, "src/ts/debugAssets.ts")
                },
                output: {
                    entryFileNames: "[name].[hash].js",
                    chunkFileNames: "[name].[hash].js",
                    assetFileNames: "[name].[hash].[ext]"
                }
            }
        },
        resolve: {
            alias: {
                "@": resolve(__dirname, "src")
            },
            extensions: [".ts", ".tsx", ".js"]
        },
        server: {
            port: 8080,
            host: "localhost",
            open: false,
            headers: {
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "same-origin"
            }
        },
        plugins: [
            tsconfigPaths(), // Auto-resolve TS path aliases
            vitePluginBanner(bannerText),
            handlebars({
                partialDirectory: resolve(__dirname, "src/html"),
                context: {
                    meta: {
                        description: "Default description for Cosmos Journeyer."
                    }
                }
            }),
            glsl()
        ],
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `@use "@/styles/variables.scss";` // Pre-load global SCSS variables
                }
            }
        },
        assetsInclude: [
            "**/*.glb",
            "**/*.env",
            "**/*.babylon",
            "**/*.ts",
            "**/*.eot",
            "**/*.svg",
            "**/*.ttf",
            "**/*.woff",
            "**/*.woff2",
            "**/*.png",
            "**/*.jpg",
            "**/*.gif",
            "**/*.webp",
            "**/*.obj",
            "**/*.mp3",
            "**/*.dds"
        ], // Include .glb and .env  and .babylon and .ts files as assets
        optimizeDeps: {},
        esbuild: {}
    };
});
