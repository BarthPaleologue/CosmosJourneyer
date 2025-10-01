import { cp, mkdir, readdir, rm, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

async function pathExists(target) {
    try {
        await stat(target);
        return true;
    } catch (error) {
        if (error.code === "ENOENT") {
            return false;
        }
        throw error;
    }
}

async function copyDirectoryContents(source, destination) {
    if (!(await pathExists(source))) {
        return;
    }

    await mkdir(destination, { recursive: true });
    const entries = await readdir(source, { withFileTypes: true });

    await Promise.all(
        entries.map((entry) =>
            cp(path.join(source, entry.name), path.join(destination, entry.name), {
                recursive: true,
            }),
        ),
    );
}

async function copyDirectory(source, destination) {
    if (!(await pathExists(source))) {
        return;
    }
    await rm(destination, { recursive: true, force: true });
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true });
}

async function buildDeploy() {
    await rm(distDir, { recursive: true, force: true });
    await mkdir(distDir, { recursive: true });

    await copyDirectoryContents(path.join(rootDir, "packages", "game", "dist"), distDir);
    await copyDirectory(path.join(rootDir, "packages", "playground", "dist"), path.join(distDir, "playground"));
    await copyDirectory(
        path.join(rootDir, "packages", "black-hole-demo", "dist"),
        path.join(distDir, "black-hole-demo"),
    );
    await copyDirectory(path.join(rootDir, "doc"), path.join(distDir, "doc"));
    await rm(path.join(rootDir, "doc"), { recursive: true, force: true });
}

buildDeploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
