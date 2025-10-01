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
        playground: entryPath,
    },
    htmlPages: [
        {
            title: "Playground - Cosmos Journeyer",
            filename: "index.html",
            template: htmlTemplate,
            chunks: ["playground"],
            favicon: faviconPath,
        },
    ],
    outputPath: path.resolve(packageRoot, "dist"),
});
