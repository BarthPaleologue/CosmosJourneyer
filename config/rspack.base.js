import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const publicPath = path.resolve(projectRoot, "packages", "frontend", "public");
const isProduction = process.env.NODE_ENV === "production";

const sharedBanner = `/*
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
 */`;

export function createBaseConfig({ entry, htmlPages, outputDir, devServer = {} }) {
    return defineConfig({
        mode: isProduction ? "production" : "development",
        context: projectRoot,
        entry,
        output: {
            filename: "[name].[contenthash].js",
            path: path.resolve(projectRoot, outputDir),
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
            ...devServer,
        },
        plugins: [
            new rspack.BannerPlugin({
                raw: true,
                banner: sharedBanner,
                stage: rspack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
                entryOnly: true,
            }),
            new TsCheckerRspackPlugin({
                typescript: {
                    configFile: path.resolve(projectRoot, "tsconfig.json"),
                },
            }),
            ...htmlPages.map(
                (page) =>
                    new HtmlWebpackPlugin({
                        inject: true,
                        favicon: path.join(publicPath, "assets", "favicon.png"),
                        ...page,
                    }),
            ),
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
                    use: [
                        {
                            loader: "sass-loader",
                            options: { sourceMap: !isProduction },
                        },
                    ],
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
}

export { projectRoot };
