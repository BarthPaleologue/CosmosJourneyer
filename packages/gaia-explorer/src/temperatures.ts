import type { GaiaRow } from "./gaia/schemas";
import type { GaiaSourceId, SimbadMetadata } from "./metadata";
const BASE = { O: 30000, B: 20000, A: 8500, F: 6500, G: 5600, K: 4400, M: 3300, L: 2100, T: 1300, Y: 600 } as const;
const SEQUENCE = ["O", "B", "A", "F", "G", "K", "M", "L", "T", "Y"] as const;
export function estimateTemperatureFromBpRp(bpRp: number | null): number | undefined {
    if (bpRp === null || !Number.isFinite(bpRp)) {
        return undefined;
    }
    const bv = Math.min(2, Math.max(-0.4, (bpRp + 0.02) / 1.289));
    const d1 = 0.92 * bv + 1.7,
        d2 = 0.92 * bv + 0.62;
    if (d1 <= 0 || d2 <= 0) {
        return undefined;
    }
    return Math.min(40000, Math.max(600, 4600 * (1 / d1 + 1 / d2)));
}
function numeric(text: string): number | undefined {
    const match = text.match(/\d+(?:\.\d+)?/);
    return match === null ? undefined : Number(match[0]);
}
export function estimateTemperatureFromSpectralType(value: string | null): number | undefined {
    if (value === null || value.trim() === "") {
        return undefined;
    }
    let type = value.trim().toUpperCase();
    if (type.startsWith("D")) {
        const n = numeric(type);
        return n === undefined ? 12000 : Math.max(5000, Math.min(40000, n * 1000));
    }
    if (type.startsWith("SD")) {
        type = type.slice(2);
    }
    const letter = SEQUENCE.find((candidate) => type.includes(candidate));
    if (letter === undefined) {
        return undefined;
    }
    const start = BASE[letter],
        subclass = numeric(type);
    if (subclass === undefined) {
        return start;
    }
    const index = SEQUENCE.indexOf(letter);
    const nextLetter = SEQUENCE[Math.min(index + 1, SEQUENCE.length - 1)] ?? letter;
    const next = BASE[nextLetter];
    return start - Math.max(0, Math.min(1, subclass / 10)) * (start - next);
}
function objectFallback(type: string | null): number | undefined {
    const upper = type?.toUpperCase() ?? "";
    if (upper.includes("WD")) {
        return 12000;
    }
    if (upper.includes("NS") || upper.includes("PSR")) {
        return 600000;
    }
    if (upper.includes("BH")) {
        return 100000;
    }
    return undefined;
}
export function resolveTemperatureOverrides(
    rows: ReadonlyArray<GaiaRow>,
    metadata: ReadonlyMap<GaiaSourceId, SimbadMetadata>,
): ReadonlyMap<GaiaSourceId, number> {
    const result = new Map<GaiaSourceId, number>();
    for (const row of rows) {
        if (row.teff_k !== null) {
            continue;
        }
        const meta = metadata.get(row.source_id);
        result.set(
            row.source_id,
            meta?.effectiveTemperature ??
                estimateTemperatureFromBpRp(row.bp_rp) ??
                estimateTemperatureFromSpectralType(meta?.spectralType ?? null) ??
                objectFallback(meta?.objectType ?? null) ??
                3500,
        );
    }
    return result;
}
