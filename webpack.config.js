// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");

const isProduction = process.env.NODE_ENV === "production";
const htmlPath = path.join(__dirname, "/src/html/");

const config = {

  entry: {
    showcase: "./src/ts/index.ts",
    experimental: "./src/ts/planetDemo.ts",
    random: "./src/ts/random.ts",
    starDemo: "./src/ts/starDemo.ts"
  },
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    open: true,
    host: "localhost",
    historyApiFallback: false,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, "src", "shaders"), to: "shaders" },
      ],
      options: {
        concurrency: 100,
      },
    }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.join(htmlPath, "index.html"),
      chunks: ["showcase"]
    }),
    new HtmlWebpackPlugin({
      filename: "planetDemo.html",
      template: path.join(htmlPath, "planetDemo.html"),
      chunks: ["experimental"]
    }),
    new HtmlWebpackPlugin({
      filename: "random.html",
      template: path.join(htmlPath, "random.html"),
      chunks: ["random"]
    }),
    new HtmlWebpackPlugin({
      filename: "starDemo.html",
      template: path.join(htmlPath, "starDemo.html"),
      chunks: ["starDemo"]
    }),

  ],


  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },

      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },

      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      {
        test: /\.html$/i,
        loader: "html-loader",
      },
      {
        test: /\.(glsl|vs|fs|vert|frag|fx)$/,
        exclude: /node_modules/,
        use: [
          'raw-loader',
          'glslify-loader'
        ]
      }


      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};



module.exports = () => {

  if (isProduction) {
    config.mode = "production";

    config.plugins.push(new MiniCssExtractPlugin());
  } else {
    config.mode = "development";
    config.devtool = "source-map";
  }
  return config;
};
