// Generated using webpack-cli https://github.com/webpack/webpack-cli
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import { rspack } from "@rspack/core";
import { TsCheckerRspackPlugin } from "ts-checker-rspack-plugin";

const isProduction = process.env.NODE_ENV === "production";
const htmlPath = path.join(import.meta.dirname, "/src/html/");

const config = {
    entry: {
        main: "./src/ts/index.ts",
        alphaTestis: "./src/ts/alphaTestis.ts",
        blackHole: "./src/ts/blackHoleDemo.ts",
        playground: "./src/ts/playground.ts"
    },
    output: {
        filename: "[name].[contenthash].js",
        path: path.resolve(import.meta.dirname, "dist"),
        clean: true
    },
    devServer: {
        open: false,
        host: "localhost",
        historyApiFallback: false,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "same-origin"
        },
        compress: true
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
            entryOnly: true
        }),
        new rspack.CssExtractRspackPlugin({
            filename: "[name].[contenthash].css"
        }),
        new TsCheckerRspackPlugin(),
        new HtmlWebpackPlugin({
            title: "Cosmos Journeyer",
            filename: "index.html",
            meta: {
                description:
                    "Cosmos Journeyer is an immersive space exploration game focused on the beauty and vastness of the universe. Embark on a personal journey through breathtaking cosmic landscapes, uncover strange anomalies, and engage in relaxing activities on alien worlds. Experience seamless transitions from starship to planet surface, and discover a story that reveals the mysteries of existence."
            },
            inject: true,
            template: path.join(htmlPath, "index.html"),
            chunks: ["main"]
        }),
        new HtmlWebpackPlugin({
            title: "Alpha Testis - Cosmos Journeyer",
            meta: {
                description: "Testing system for Cosmos Journeyer."
            },
            filename: "alphaTestis.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["alphaTestis"]
        }),
        new HtmlWebpackPlugin({
            title: "Black Hole - Cosmos Journeyer",
            meta: {
                description: "Black hole simulation for Cosmos Journeyer with light bending and accretion disk."
            },
            filename: "blackhole.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["blackHole"]
        }),
        new HtmlWebpackPlugin({
            title: "Playground - Cosmos Journeyer",
            filename: "playground.html",
            template: path.join(htmlPath, "emptyIndex.html"),
            chunks: ["playground"]
        })
    ],
    watchOptions: {
        ignored: /node_modules/
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: "builtin:swc-loader",
                exclude: [/node_modules/]
            },
            {
                test: /\.css$/i,
                use: [rspack.CssExtractRspackPlugin.loader, "css-loader"],
                type: "javascript/auto"
                // exclude: [/node_modules/] can't be used for now because bodyEditor uses a css file from node_modules
            },
            {
                test: /\.s[ac]ss$/i,
                use: [rspack.CssExtractRspackPlugin.loader, "css-loader", "sass-loader"],
                type: "javascript/auto",
                exclude: [/node_modules/]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|otf|png|jpg|gif|webp|glb|obj|mp3|ogg|babylon|env|dds)$/i,
                type: "asset/resource",
                exclude: [/node_modules/]
            },
            {
                test: /\.(glsl|vs|fs|vert|frag|fx)$/,
                exclude: /node_modules/,
                use: ["ts-shader-loader"]
            }
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};

export default () => {
    if (isProduction) {
        config.mode = "production";
    } else {
        config.mode = "development";
    }
    config.experiments = {
        asyncWebAssembly: true,
        topLevelAwait: true
    };
    config.optimization = {
        minimize: isProduction,
        splitChunks: {
            chunks: "async",
            minSize: 20000,
            minChunks: 1,
            maxAsyncRequests: 30,
            maxInitialRequests: 30,
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
    };
    return config;
};
