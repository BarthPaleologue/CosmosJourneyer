import { execSync } from "node:child_process";
import { Dirent } from "node:fs";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, "..");

const distDir = join(rootDir, "dist");
const websiteOutDir = join(rootDir, "packages", "website", "out");
const gameDistDir = join(rootDir, "packages", "game", "dist");
const distGameDir = join(distDir, "game");

const run = (command: string) => {
    execSync(command, { cwd: rootDir, stdio: "inherit" });
};

await rm(distDir, { recursive: true, force: true });

run("pnpm build:game");
run("pnpm build:website");

await mkdir(distDir, { recursive: true });

const websiteEntries: Dirent[] = await readdir(websiteOutDir, { withFileTypes: true });
if (websiteEntries.length === 0) {
    throw new Error("Website export did not produce any files.");
}

await Promise.all(
    websiteEntries.map((entry) => {
        const source = join(websiteOutDir, entry.name);
        const destination = join(distDir, entry.name);

        return cp(source, destination, { recursive: entry.isDirectory(), force: true });
    }),
);

await rm(distGameDir, { recursive: true, force: true });
await cp(gameDistDir, distGameDir, { recursive: true });
