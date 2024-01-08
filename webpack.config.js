// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const isProduction = process.env.NODE_ENV === "production";
const htmlPath = path.join(__dirname, "/src/html/");

const config = {
    entry: {
        showcase: "./src/ts/index.ts",
        random: "./src/ts/randomizer.ts",
        blackHole: "./src/ts/blackHoleDemo.ts",
        physicSpaceship: "./src/ts/physicSpaceship.ts",
        landingSimulator: "./src/ts/landingSimulator.ts",
        characterDemo: "./src/ts/characterDemo.ts",
        playground: "./src/ts/playground.ts",
        xr: "./src/ts/xr.ts",
        debugAssets: "./src/ts/debugAssets.ts"
    },
    output: {
        path: path.resolve(__dirname, "dist")
    },
    devServer: {
        open: true,
        host: "localhost",
        historyApiFallback: false,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "same-origin"
        }
    },

    plugins: [
        new HtmlWebpackPlugin({
            title: "Planet Engine",
            filename: "index.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["showcase"]
        }),
        new HtmlWebpackPlugin({
            title: "Randomizer",
            filename: "random.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["random"]
        }),
        new HtmlWebpackPlugin({
            title: "BlackHole Demo",
            filename: "blackhole.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["blackHole"]
        }),
        new HtmlWebpackPlugin({
            title: "Physics Spaceship",
            filename: "physicSpaceship.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["physicSpaceship"]
        }),
        new HtmlWebpackPlugin({
            title: "Landing Simulator",
            filename: "landingSimulator.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["landingSimulator"]
        }),
        new HtmlWebpackPlugin({
            title: "Character demo",
            filename: "characterdemo.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["characterDemo"]
        }),
        new HtmlWebpackPlugin({
            title: "Playground",
            filename: "playground.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["playground"]
        }),
        new HtmlWebpackPlugin({
            title: "XR",
            filename: "xr.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["xr"]
        }),
        new HtmlWebpackPlugin({
            title: "Debug Texture",
            filename: "debugassets.html",
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
                test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif|glb|obj|mp3)$/i,
                type: "asset"
            },

            {
                test: /\.html$/i,
                exclude: /node_modules/,
                loader: "html-loader"
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
