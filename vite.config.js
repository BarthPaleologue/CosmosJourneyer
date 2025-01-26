import { defineConfig } from "vite";
import { resolve } from "path";
import { createHtmlPlugin } from "vite-plugin-html";
import viteCompression from "vite-plugin-compression"; // Enable compression
import banner from "vite-plugin-banner";

const isProduction = process.env.NODE_ENV === "production";

export default defineConfig({
  base: "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "./src/ts/index.ts"),
        alphaTestis: resolve(__dirname, "./src/ts/alphaTestis.ts"),
        blackHole: resolve(__dirname, "./src/ts/blackHoleDemo.ts"),
        playground: resolve(__dirname, "./src/ts/playground.ts"),
        xr: resolve(__dirname, "./src/ts/xr.ts"),
        spaceStationGenerator: resolve(__dirname, "./src/ts/spaceStationGenerator.ts"),
        debugAssets: resolve(__dirname, "./src/ts/debugAssets.ts"),
      },
    },
    outDir: "dist",
    sourcemap: !isProduction,
    minify: isProduction ? "terser" : false,
  },
  server: {
    open: false,
    host: "localhost",
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "same-origin",
    },
    hmr: true,
    compress: true,
  },
  plugins: [
    banner(`
      // This file is part of Cosmos Journeyer
      //
      // Copyright (C) 2024 Barthélemy Paléologue <barth.paleologue@cosmosjourneyer.com>
      //
      // Licensed under AGPL v3 or later.
    `),
    createHtmlPlugin({
      inject: {
        data: {
          title: "Cosmos Journeyer",
        },
      },
      pages: [
        {
          entry: "main",
          filename: "index.html",
          template: resolve(__dirname, "./src/html/index.html"),
        },
        // Add more entries as needed
      ],
    }),
    viteCompression(), // Asset compression plugin
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/global.scss";`,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
    extensions: [".tsx", ".ts", ".js"],
  },
  optimizeDeps: {
    include: ["ts-shader-loader"],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development"),
  },
  experimental: {
    asyncWebAssembly: true,
    topLevelAwait: true,
  },
});
