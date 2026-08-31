import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

import type { GaiaRow } from "../gaia/schemas";
import type { GaiaSourceId, SimbadMetadata } from "../metadata";
import { createSyncTapClient } from "../tap/client";
import type { TapClient, TapClientOptions, TapError } from "../tap/client";
import { chooseBestName } from "./naming";
import { SimbadRowSchema } from "./schemas";

export const SimbadTapSyncEndpoint = "https://simbad.cds.unistra.fr/simbad/sim-tap/sync";
export type SimbadClientOptions = TapClientOptions & Readonly<{ batchSize?: number; endpoint?: string }>;
const quote = (value: string): string => `'${value.replaceAll("'", "''")}'`;
const nullableText = (value: string | undefined): string | null => {
    const text = value?.trim();
    return text === undefined || text === "" ? null : text;
};
const nullableNumber = (value: string | undefined): number | null => {
    const text = nullableText(value);
    return text === null ? null : Number(text);
};
function parseMetadata(
    raw: Readonly<Record<string, string>>,
    batch: ReadonlyArray<GaiaRow>,
): Result<readonly [GaiaSourceId, SimbadMetadata] | undefined, string> {
    const parsed = SimbadRowSchema.safeParse({
        input_id: raw["input_id"],
        main_id: raw["main_id"],
        ids: (raw["ids"] ?? "").split("|").filter((identifier) => identifier !== ""),
        spectral_type: nullableText(raw["spectral_type"]),
        object_type: nullableText(raw["object_type"]),
        effective_temperature: nullableNumber(raw["effective_temperature"]),
    });
    if (!parsed.success) {
        return err(parsed.error.message);
    }
    const source = batch.find((row) => (row.designation ?? `Gaia DR3 ${row.source_id}`) === parsed.data.input_id);
    if (source === undefined) {
        return ok(undefined);
    }
    return ok([
        source.source_id,
        {
            name: chooseBestName(parsed.data.main_id, parsed.data.ids, parsed.data.input_id),
            spectralType: parsed.data.spectral_type,
            objectType: parsed.data.object_type,
            effectiveTemperature: parsed.data.effective_temperature,
        },
    ]);
}
function addBatchMetadata(
    metadata: Map<GaiaSourceId, SimbadMetadata>,
    raws: ReadonlyArray<Readonly<Record<string, string>>>,
    batch: ReadonlyArray<GaiaRow>,
): Result<undefined, string> {
    for (const raw of raws) {
        const parsed = parseMetadata(raw, batch);
        if (!parsed.success) {
            return parsed;
        }
        if (parsed.value !== undefined) {
            metadata.set(...parsed.value);
        }
    }
    return ok(undefined);
}
export class SimbadClient {
    private readonly tap: TapClient;
    private readonly batchSize: number;
    public constructor(tap: TapClient, batchSize = 400) {
        this.tap = tap;
        this.batchSize = batchSize;
    }
    async query(
        rows: ReadonlyArray<GaiaRow>,
        signal?: AbortSignal,
    ): Promise<Result<ReadonlyMap<GaiaSourceId, SimbadMetadata>, TapError>> {
        const metadata = new Map<GaiaSourceId, SimbadMetadata>();
        for (let start = 0; start < rows.length; start += this.batchSize) {
            const batch = rows.slice(start, start + this.batchSize);
            const ids = batch.map((row) => row.designation ?? `Gaia DR3 ${row.source_id}`);
            const adql = `SELECT ident.id AS input_id, basic.main_id, basic.sp_type AS spectral_type, basic.otype AS object_type, mesFe_h.teff AS effective_temperature, ids.ids FROM ident JOIN basic ON ident.oidref = basic.oid LEFT JOIN ids ON ids.oidref = basic.oid LEFT JOIN mesFe_h ON mesFe_h.oidref = basic.oid WHERE ident.id IN (${ids.map(quote).join(",")})`;
            const response = await this.tap.query(adql, signal);
            if (!response.success) {
                return response;
            }
            const parsed = addBatchMetadata(metadata, response.value, batch);
            if (!parsed.success) {
                return err({
                    kind: "protocol",
                    message: `Invalid SIMBAD payload: ${parsed.error}`,
                });
            }
        }
        return ok(metadata);
    }
}
export function createSimbadClient(options: SimbadClientOptions = {}): SimbadClient {
    const { batchSize, endpoint = SimbadTapSyncEndpoint, ...tapOptions } = options;
    return new SimbadClient(createSyncTapClient(endpoint, tapOptions), batchSize);
}
