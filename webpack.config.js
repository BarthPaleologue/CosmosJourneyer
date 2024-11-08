// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require("webpack");

const isProduction = process.env.NODE_ENV === "production";
const htmlPath = path.join(__dirname, "/src/html/");

const config = {
    entry: {
        main: "./src/ts/index.ts",
        alphaTestis: "./src/ts/alphaTestis.ts",
        blackHole: "./src/ts/blackHoleDemo.ts",
        playground: "./src/ts/playground.ts",
        xr: "./src/ts/xr.ts",
        spaceStationGenerator: "./src/ts/spaceStationGenerator.ts",
        debugAssets: "./src/ts/debugAssets.ts"
    },
    output: {
        filename: "[name].[contenthash].js",
        path: path.resolve(__dirname, "dist")
    },
    devServer: {
        open: false,
        host: "localhost",
        historyApiFallback: false,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "same-origin"
        }
    },

    plugins: [
        new webpack.BannerPlugin({
            raw: true,
            banner: `
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
        `,
            stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
        }),
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
            template: path.join(htmlPath, "index.html"),
            chunks: ["playground"]
        }),
        new HtmlWebpackPlugin({
            title: "XR - Cosmos Journeyer",
            meta: {
                description: "XR test for Cosmos Journeyer."
            },
            filename: "xr.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["xr"]
        }),
        new HtmlWebpackPlugin({
            title: "Space station generator - Cosmos Journeyer",
            meta: {
                description: "Space station generator for Cosmos Journeyer."
            },
            filename: "spaceStationGenerator.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["spaceStationGenerator"]
        }),
        new HtmlWebpackPlugin({
            title: "Debug assets - Cosmos Journeyer",
            meta: {
                description: "Debug assets visualization for Cosmos Journeyer."
            },
            filename: "debugAssets.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["debugAssets"]
        }),
        new MiniCssExtractPlugin()
    ],

    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/i,
                loader: "ts-loader",
                exclude: ["/node_modules/"]
            },
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },

            {
                test: /\.s[ac]ss$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"]
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif|webp|glb|obj|mp3|babylon|env|dds)$/i,
                type: "asset"
            },
            {
                test: /\.(glsl|vs|fs|vert|frag|fx)$/,
                exclude: /node_modules/,
                use: ["ts-shader-loader"]
            }

            // Add your rules for custom modules here
            // Learn more about loaders from https://webpack.js.org/loaders/
        ]
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    }
};

module.exports = () => {
    if (isProduction) {
        config.mode = "production";
    } else {
        config.mode = "development";
        config.devtool = "source-map";
    }
    config.experiments = {
        asyncWebAssembly: true,
        topLevelAwait: true
    };
    return config;
};
