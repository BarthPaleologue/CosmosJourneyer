import path from "path";

import { defineConfig } from "@rspack/cli";
import { rspack } from "@rspack/core";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

const isProduction = process.env.NODE_ENV === "production";

export function createSharedConfig({ projectRoot, entry, htmlPages, outputPath = path.resolve(projectRoot, "dist") }) {
    if (projectRoot === undefined) {
        throw new Error("createSharedConfig requires a projectRoot");
    }
    if (entry === undefined) {
        throw new Error("createSharedConfig requires an entry configuration");
    }
    if (htmlPages === undefined || htmlPages.length === 0) {
        throw new Error("createSharedConfig requires at least one HTML page definition");
    }

    return defineConfig({
        mode: isProduction ? "production" : "development",
        entry,
        output: {
            filename: "[name].[contenthash].js",
            path: outputPath,
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
            ...htmlPages.map(
                (page) =>
                    new rspack.HtmlRspackPlugin({
                        title: page.title,
                        filename: page.filename,
                        meta: page.meta,
                        inject: true,
                        template: page.template,
                        chunks: page.chunks,
                        favicon: page.favicon,
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
}
