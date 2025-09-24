import path from "node:path";

import { createBaseConfig, projectRoot } from "./config/rspack.base.js";

const gameHtmlPath = path.resolve(projectRoot, "packages", "game", "public");

export default createBaseConfig({
    entry: {
        main: "./packages/game/src/index.ts",
        blackHole: "./packages/game/src/blackHoleDemo.ts",
    },
    outputDir: path.join("dist", "game"),
    htmlPages: [
        {
            title: "Cosmos Journeyer",
            filename: "index.html",
            template: path.join(gameHtmlPath, "index.html"),
            chunks: ["main"],
            meta: {
                description:
                    "Cosmos Journeyer is an immersive space exploration game focused on the beauty and vastness of the universe. Embark on a personal journey through breathtaking cosmic landscapes, uncover strange anomalies, and engage in relaxing activities on alien worlds. Experience seamless transitions from starship to planet surface, and discover a story that reveals the mysteries of existence.",
            },
        },
        {
            title: "Black Hole - Cosmos Journeyer",
            filename: "blackhole.html",
            template: path.join(gameHtmlPath, "index.html"),
            chunks: ["blackHole"],
            meta: {
                description: "Black hole simulation for Cosmos Journeyer with light bending and accretion disk.",
            },
        },
    ],
});
