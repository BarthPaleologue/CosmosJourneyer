import path from "path";
import { fileURLToPath } from "url";

import { createSharedConfig } from "../../rspack.shared.js";

const __filename = fileURLToPath(import.meta.url);
const packageRoot = path.dirname(__filename);
const projectRoot = path.resolve(packageRoot, "../..");

const htmlTemplate = path.resolve(packageRoot, "html", "index.html");
const faviconPath = path.resolve(packageRoot, "public", "favicon.png");
const entryPath = path.resolve(packageRoot, "src", "index.ts");

export default createSharedConfig({
    projectRoot,
    entry: {
        blackHole: entryPath,
    },
    htmlPages: [
        {
            title: "Black Hole Demo - Cosmos Journeyer",
            filename: "index.html",
            template: htmlTemplate,
            chunks: ["blackHole"],
            favicon: faviconPath,
            meta: {
                description: "Black hole simulation for Cosmos Journeyer with light bending and accretion disk.",
            },
        },
    ],
    outputPath: path.resolve(packageRoot, "dist"),
});
