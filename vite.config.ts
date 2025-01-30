import { defineConfig } from "vite";
import path, { resolve } from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import vitePluginBanner from "vite-plugin-banner";
import glsl from "vite-plugin-glsl";
import wasm from "vite-plugin-wasm";
import fs from "fs";
import topLevelAwait from "vite-plugin-top-level-await";

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

const htmlFiles = fs.readdirSync(path.resolve(__dirname, "src/html")).filter((file) => file.endsWith(".html"));

// Define the type for `input` explicitly
const input: Record<string, string> = htmlFiles.reduce(
    (acc, file) => {
        acc[file.replace(".html", "")] = path.resolve(__dirname, "src/html", file);
        return acc;
    },
    {} as Record<string, string>
);

export default defineConfig(({ mode }) => {
    return {
        root: "./src",
        publicDir: "../public",
        build: {
            outDir: "../dist",
            target: "es2022",
            emptyOutDir: true,
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, "src/ts/index.ts"),
                    alphaTestis: path.resolve(__dirname, "src/ts/alphaTestis.ts"),
                    blackHole: path.resolve(__dirname, "src/ts/blackHoleDemo.ts"),
                    playground: path.resolve(__dirname, "src/ts/playground.ts"),
                    xr: path.resolve(__dirname, "src/ts/xr.ts"),
                    spaceStationGenerator: path.resolve(__dirname, "src/ts/spaceStationGenerator.ts"),
                    debugAssets: path.resolve(__dirname, "src/ts/debugAssets.ts")
                },
                output: {
                    entryFileNames: "[name].[hash].js",
                    assetFileNames: "[name].[hash][extname]"
                }
            },
            sourcemap: mode === "development" ? "inline" : false,
            minify: mode === "production" ? "esbuild" : false
        },
        resolve: {
            alias: {
                "@": resolve(__dirname, "src")
            },
            extensions: [".ts", ".js", ".json"]
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
        plugins: [tsconfigPaths(), vitePluginBanner(bannerText), glsl(), wasm(), topLevelAwait()],
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
