import path from "path";
import { fileURLToPath } from "url";

import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

// __dirname replacement in ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === "production";

// Define reusable paths
const projectRoot = __dirname;
const htmlPath = path.resolve(projectRoot, "src", "html");

export default defineConfig({
    mode: isProduction ? "production" : "development",
    entry: {
        main: "./src/ts/index.ts",
        blackHole: "./src/ts/blackHoleDemo.ts",
        playground: "./src/ts/playground.ts",
    },
    output: {
        filename: "[name].[contenthash].js",
        path: path.resolve(projectRoot, "dist"),
        clean: true,
    },
    target: ["web", "es2022"],
    devtool: isProduction ? false : "source-map",
    devServer: {
        open: false,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "same-origin",
        },
    },
    plugins: [
        new rspack.BannerPlugin({
            raw: true,
            banner: `/*
 *  This file is part of Cosmos Journeyer
 *
 *  Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
`,
            stage: rspack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
            entryOnly: true,
        }),
        new TsCheckerRspackPlugin(),
        new rspack.HtmlRspackPlugin({
            title: "Cosmos Journeyer",
            filename: "index.html",
            meta: {
                description:
                    "Cosmos Journeyer is an immersive space exploration game focused on the beauty and vastness of the universe. Embark on a personal journey through breathtaking cosmic landscapes, uncover strange anomalies, and engage in relaxing activities on alien worlds. Experience seamless transitions from starship to planet surface, and discover a story that reveals the mysteries of existence.",
            },
            inject: true,
            template: path.join(htmlPath, "index.html"),
            chunks: ["main"],
            favicon: path.join(htmlPath, "../asset/favicon.png"),
        }),
        new rspack.HtmlRspackPlugin({
            title: "Black Hole - Cosmos Journeyer",
            meta: {
                description: "Black hole simulation for Cosmos Journeyer with light bending and accretion disk.",
            },
            filename: "blackhole.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["blackHole"],
            favicon: path.join(htmlPath, "../asset/favicon.png"),
        }),
        new rspack.HtmlRspackPlugin({
            title: "Playground - Cosmos Journeyer",
            filename: "playground.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["playground"],
            favicon: path.join(htmlPath, "../asset/favicon.png"),
        }),
    ],
    watchOptions: {
        ignored: /node_modules/,
    },
    module: {
        rules: [
            {
                test: /\.[jt]sx?$/i,
                loader: "builtin:swc-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.s[ac]ss$/i,
                use: [{ loader: "sass-loader", options: { sourceMap: !isProduction } }],
                type: "css/auto",
                exclude: /node_modules/,
            },
            {
                test: /\.(eot|svg|ttf|woff2?|otf|png|jpe?g|gif|webp|glb|obj|mp3|ogg|babylon|env|dds)$/i,
                type: "asset/resource",
                exclude: /node_modules/,
            },
            {
                test: /\.(glsl|vs|fs|vert|frag|fx)$/,
                loader: "ts-shader-loader",
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        tsConfig: path.resolve(projectRoot, "tsconfig.json"),
        extensions: [".tsx", ".ts", ".js"],
    },
    experiments: {
        asyncWebAssembly: true,
        topLevelAwait: true,
        css: true,
    },
    optimization: {
        minimize: isProduction,
        splitChunks: {
            chunks: "all",
            minSize: 20000,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true,
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true,
                },
            },
        },
    },
});
