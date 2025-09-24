import path from "node:path";

import { createBaseConfig, projectRoot } from "./config/rspack.base.js";

const playgroundHtmlPath = path.resolve(projectRoot, "packages", "playground", "public");

export default createBaseConfig({
    entry: {
        playground: "./packages/playground/src/playground.ts",
    },
    outputDir: path.join("dist", "playground"),
    htmlPages: [
        {
            title: "Playground - Cosmos Journeyer",
            filename: "index.html",
            template: path.join(playgroundHtmlPath, "index.html"),
            chunks: ["playground"],
            meta: {
                description: "Interactive playground scenes built with Cosmos Journeyer rendering systems.",
            },
        },
    ],
});
