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

    // Define the shape of the pages object to prevent TypeScript error
    type PageContext = {
        title: string;
        description?: string;
    };

    const pages: Record<string, PageContext> = {
        "src/html/index.html": {
            title: "Cosmos Journeyer",
            description:
                "Cosmos Journeyer is an immersive space exploration game focused on the beauty and vastness of the universe. Embark on a personal journey through breathtaking cosmic landscapes, uncover strange anomalies, and engage in relaxing activities on alien worlds."
        },
        "src/html/alphaTestis.html": {
            title: "Alpha Testis - Cosmos Journeyer",
            description: "Testing system for Cosmos Journeyer."
        },
        "src/html/blackHole.html": {
            title: "Black Hole - Cosmos Journeyer",
            description: "Black hole simulation for Cosmos Journeyer with light bending and accretion disk."
        },
        "src/html/playground.html": {
            title: "Playground - Cosmos Journeyer"
        },
        "src/html/xr.html": {
            title: "XR - Cosmos Journeyer",
            description: "XR test for Cosmos Journeyer."
        },
        "src/html/spaceStationGenerator.html": {
            title: "Space Station Generator - Cosmos Journeyer",
            description: "Space station generator for Cosmos Journeyer."
        },
        "src/html/debugAssets.html": {
            title: "Debug Assets - Cosmos Journeyer",
            description: "Debug assets visualization for Cosmos Journeyer."
        }
    };

    return {
        root: ".",
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
            extensions: [".ts", ".js"]
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
                artialDirectory: resolve(__dirname, "src/html/partials"),
                context: (pagePath: string | number) => {
                    const page = pages[pagePath];
                    return {
                        ...page,
                        title: process.env.VITE_APP_TITLE || page.title
                    };
                }
            }),
            glsl()
        ],
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `@use "@/styles/variables.scss";`
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
        ],
        optimizeDeps: {},
        esbuild: {}
    };
});
