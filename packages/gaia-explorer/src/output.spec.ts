import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { promisify } from "node:util";
import { gunzip } from "node:zlib";

import { describe, expect, it } from "vitest";

import { buildOutput, dumpOutputs } from "./output";
describe("output", () => {
    it("writes identical JSON and gzip", async () => {
        const payload = buildOutput(
            new Map(),
            { gridSize: 5, halfExtent: 50 },
            { radiusLy: 50, parallaxOverErrorMin: 10, ruweMax: 10 },
            1,
            0,
            () => new Date("2020-01-01T00:00:00Z"),
        );
        const dir = await mkdtemp(join(tmpdir(), "gaia-")),
            json = join(dir, "a.json"),
            gz = `${json}.gz`;
        await dumpOutputs(payload, json, gz);
        expect((await promisify(gunzip)(await readFile(gz))).toString()).toBe(await readFile(json, "utf8"));
        expect(payload.metadata.generated_utc).toBe("2020-01-01T00:00:00.000Z");
    });
    it("creates directories for relative output paths", async () => {
        const payload = buildOutput(
            new Map(),
            { gridSize: 5, halfExtent: 50 },
            { radiusLy: 50, parallaxOverErrorMin: 10, ruweMax: 10 },
            0,
            0,
        );
        const dir = await mkdtemp(join(tmpdir(), "gaia-relative-"));
        const json = relative(process.cwd(), join(dir, "nested", "gaia.json"));
        const gzip = `${json}.gz`;
        await dumpOutputs(payload, json, gzip);
        expect((await promisify(gunzip)(await readFile(gzip))).toString()).toBe(await readFile(json, "utf8"));
    });
});
