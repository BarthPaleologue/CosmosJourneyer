import { defineConfig, normalizePath } from "vite";
import { resolve } from "path";
import path from "node:path";
import glsl from "vite-plugin-glsl";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import { createHtmlPlugin } from "vite-plugin-html";
import vitePluginBanner from "vite-plugin-banner";
import handlebars from "vite-plugin-handlebars";
import { viteStaticCopy } from "vite-plugin-static-copy";

const isProduction = process.env.NODE_ENV === "production";

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

export default defineConfig({
    base: "./",
    build: {
        outDir: "dist",
        target: "es2022",
        rollupOptions: {
            input: {
                main: resolve(__dirname, "src/ts/index.ts"),
                alphaTestis: resolve(__dirname, "src/ts/alphaTestis.ts"),
                blackHole: resolve(__dirname, "src/ts/blackHoleDemo.ts"),
                playground: resolve(__dirname, "src/ts/playground.ts")
            },
            output: {
                entryFileNames: "[name].[hash].js",
                assetFileNames: "[name].[hash][extname]",
                format: "es",
                manualChunks: (id) => {
                    if (id.includes("node_modules")) {
                        return "vendor";
                    }
                    if (id.includes("some-heavy-module")) {
                        return "heavy";
                    }
                    return null;
                }
            }
        },
        chunkSizeWarningLimit: 6000,
        sourcemap: !isProduction,
        minify: isProduction ? "esbuild" : false
    },
    server: {
        port: 8080,
        open: false,
        host: "localhost",
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "same-origin"
        }
    },
    worker: {
        format: "es"
    },
    plugins: [
        wasm(),
        topLevelAwait(),
        glsl(),
        handlebars({
            context: {
                title: "Cosmos Journeyer"
            }
        }),
        vitePluginBanner(bannerText),
        viteStaticCopy({
            targets: [
                {
                    src: normalizePath(
                        path.resolve(__dirname, "./node_modules/@babylonjs/havok/lib/esm/HavokPhysics.wasm")
                    ),
                    dest: "public"
                }
            ]
        }),
        createHtmlPlugin({
            minify: isProduction,
            pages: [
                {
                    filename: "index.html",
                    template: "src/html/index.html",
                    injectOptions: { data: { title: "Cosmos Journeyer" } }
                },
                {
                    filename: "alphaTestis.html",
                    template: "src/html/index.html",
                    injectOptions: { data: { title: "Alpha Testis - Cosmos Journeyer" } }
                },
                {
                    filename: "blackhole.html",
                    template: "src/html/index.html",
                    injectOptions: { data: { title: "Black Hole - Cosmos Journeyer" } }
                },
                {
                    filename: "playground.html",
                    template: "src/html/emptyIndex.html",
                    injectOptions: { data: { title: "Playground - Cosmos Journeyer" } }
                }
            ]
        })
    ],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src")
        },
        extensions: [".ts", ".js", ".json"]
    },
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
        "**/*.dds",
        "**/*.html"
    ],
    optimizeDeps: {
        esbuildOptions: {
            target: "esnext"
        }
    },
    esbuild: { target: "esnext" }
});
