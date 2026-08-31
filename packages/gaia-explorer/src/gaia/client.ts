import { err, ok } from "@cosmos-journeyer/typescript";
import type { Result } from "@cosmos-journeyer/typescript";

import type { QueryConfig } from "../config";
import { createAsyncTapClient } from "../tap/client";
import type { AsyncTapClientOptions, TapClient, TapError } from "../tap/client";
import { buildGaiaAdql } from "./adql";
import { GaiaRowSchema } from "./schemas";
import type { GaiaRow } from "./schemas";
export const GaiaTapAsyncEndpoint = "https://gea.esac.esa.int/tap-server/tap/async";
export type GaiaClientOptions = AsyncTapClientOptions & Readonly<{ endpoint?: string }>;
const numeric = (value: string): number | null => (value.trim() === "" ? null : Number(value));
function parseGaiaRows(rows: ReadonlyArray<Readonly<Record<string, string>>>): Result<ReadonlyArray<GaiaRow>, string> {
    const parsedRows: GaiaRow[] = [];
    for (const raw of rows) {
        const designation = raw["designation"]?.trim();
        const parsed = GaiaRowSchema.safeParse({
            source_id: raw["source_id"],
            designation: designation === undefined || designation === "" ? null : designation,
            ra: numeric(raw["ra"] ?? ""),
            dec: numeric(raw["dec"] ?? ""),
            parallax: numeric(raw["parallax"] ?? ""),
            parallax_over_error: numeric(raw["parallax_over_error"] ?? ""),
            ruwe: numeric(raw["ruwe"] ?? ""),
            bp_rp: numeric(raw["bp_rp"] ?? ""),
            teff_k: numeric(raw["teff_k"] ?? ""),
        });
        if (!parsed.success) {
            return err(parsed.error.message);
        }
        parsedRows.push(parsed.data);
    }
    return ok(parsedRows);
}
export class GaiaClient {
    private readonly tap: TapClient;
    public constructor(tap: TapClient) {
        this.tap = tap;
    }
    async query(config: QueryConfig, signal?: AbortSignal): Promise<Result<ReadonlyArray<GaiaRow>, TapError>> {
        const result = await this.tap.query(buildGaiaAdql(config), signal);
        if (!result.success) {
            return result;
        }
        const parsed = parseGaiaRows(result.value);
        if (!parsed.success) {
            return err({
                kind: "protocol",
                message: `Invalid Gaia payload: ${parsed.error}`,
            });
        }
        return parsed;
    }
}
export function createGaiaClient(options: GaiaClientOptions = {}): GaiaClient {
    const { endpoint = GaiaTapAsyncEndpoint, ...tapOptions } = options;
    return new GaiaClient(createAsyncTapClient(endpoint, tapOptions));
}
