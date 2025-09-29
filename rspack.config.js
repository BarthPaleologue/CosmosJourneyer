import path from "path";
import { fileURLToPath } from "url";

import { createSharedConfig } from "./rspack.shared.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = __dirname;
const htmlPath = path.resolve(projectRoot, "src", "html");
const frontendAssetsPath = path.resolve(projectRoot, "packages", "frontend", "src", "asset");

export default createSharedConfig({
    projectRoot,
    entry: {
        main: "./src/ts/index.ts",
        playground: "./src/ts/playground.ts",
    },
    htmlPages: [
        {
            title: "Cosmos Journeyer",
            filename: "index.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["main"],
            favicon: path.join(frontendAssetsPath, "favicon.png"),
            meta: {
                description:
                    "Cosmos Journeyer is an immersive space exploration game focused on the beauty and vastness of the universe. Embark on a personal journey through breathtaking cosmic landscapes, uncover strange anomalies, and engage in relaxing activities on alien worlds. Experience seamless transitions from starship to planet surface, and discover a story that reveals the mysteries of existence.",
            },
        },
        {
            title: "Playground - Cosmos Journeyer",
            filename: "playground.html",
            template: path.join(htmlPath, "index.html"),
            chunks: ["playground"],
            favicon: path.join(frontendAssetsPath, "favicon.png"),
        },
    ],
});
