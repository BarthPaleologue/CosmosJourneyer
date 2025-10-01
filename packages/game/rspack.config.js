import path from "path";
import { fileURLToPath } from "url";

import { createSharedConfig } from "../../rspack.shared.js";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.dirname(__filename);
const projectRoot = path.resolve(packageRoot, "../..");

const entryPath = path.resolve(packageRoot, "src", "index.ts");
const htmlTemplate = path.resolve(packageRoot, "html", "index.html");
const faviconPath = path.resolve(packageRoot, "public", "favicon.png");

export default createSharedConfig({
    projectRoot,
    entry: {
        main: entryPath,
    },
    htmlPages: [
        {
            title: "Cosmos Journeyer",
            filename: "index.html",
            template: htmlTemplate,
            chunks: ["main"],
            favicon: faviconPath,
            meta: {
                description:
                    "Cosmos Journeyer is an immersive space exploration game focused on the beauty and vastness of the universe. Embark on a personal journey through breathtaking cosmic landscapes, uncover strange anomalies, and engage in relaxing activities on alien worlds. Experience seamless transitions from starship to planet surface, and discover a story that reveals the mysteries of existence.",
            },
        },
    ],
    outputPath: path.resolve(packageRoot, "dist"),
});
