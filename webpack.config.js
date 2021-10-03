// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const fs = require('fs');

const isProduction = process.env.NODE_ENV == "production";
const htmlPath = path.join(__dirname, "/src/html/");

const config = {

  entry: {
    showcase: ["./src/ts/showcase.ts"],
    experimental: ["./src/ts/experimental.ts"]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    open: true,
    host: "localhost",
  },


  devServer: {
    historyApiFallback: false
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
      filename: "controler.html",
      template: path.join(htmlPath, "controler.html"),
      chunks: ["experimental"]
    })

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


      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
};



module.exports = () => {

  //add every html file as chunk
  /*for (const file of fs.readdirSync(htmlPath)) {
    config.plugins.push(new HtmlWebpackPlugin({ filename: file, template: path.join(htmlPath, file) }));
  }*/



  if (isProduction) {
    config.mode = "production";

    config.plugins.push(new MiniCssExtractPlugin());
  } else {
    config.mode = "development";
    config.devtool = "source-map";
  }
  return config;
};
