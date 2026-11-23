import type { DeepReadonly } from "@cosmos-journeyer/typescript";

import type { StarNature } from "./classification";
import { LightYearPerParsec } from "./config";
import type { GaiaRow } from "./gaia/schemas";
import type { GaiaSourceId } from "./metadata";
export type StarRecord = Readonly<{
    name: string;
    x: number;
    y: number;
    z: number;
    temperature: number | null;
    sourceId: GaiaSourceId | null;
    nature: StarNature | null;
}>;
/**
 * Converts right ascension and declination into Cartesian light-year coordinates.
 * @param raDegrees Right ascension in degrees.
 * @param decDegrees Declination in degrees.
 * @param distanceLy Distance from the origin in light years.
 * @returns The x, y, and z coordinates in light years.
 */
export function toCartesian(
    raDegrees: number,
    decDegrees: number,
    distanceLy: number,
): readonly [number, number, number] {
    const ra = (raDegrees * Math.PI) / 180;
    const dec = (decDegrees * Math.PI) / 180;
    const cosDec = Math.cos(dec);
    return [distanceLy * cosDec * Math.cos(ra), distanceLy * cosDec * Math.sin(ra), distanceLy * Math.sin(dec)];
}
export class StarLookupMaps {
    public readonly names: DeepReadonly<Map<GaiaSourceId, string>>;
    public readonly temperatures: DeepReadonly<Map<GaiaSourceId, number>>;
    public readonly natures: DeepReadonly<Map<GaiaSourceId, StarNature>>;

    public constructor(
        names: DeepReadonly<Map<GaiaSourceId, string>>,
        temperatures: DeepReadonly<Map<GaiaSourceId, number>>,
        natures: DeepReadonly<Map<GaiaSourceId, StarNature>>,
    ) {
        this.names = names;
        this.temperatures = temperatures;
        this.natures = natures;
    }

    public static Empty(): StarLookupMaps {
        return new StarLookupMaps(new Map(), new Map(), new Map());
    }

    public resolveName(row: DeepReadonly<GaiaRow>): string {
        return this.names.get(row.source_id) ?? row.designation ?? row.source_id;
    }

    public resolveTemperature(row: DeepReadonly<GaiaRow>): number | null {
        return row.teff_k ?? this.temperatures.get(row.source_id) ?? null;
    }

    public resolveNature(sourceId: GaiaSourceId): StarNature | null {
        return this.natures.get(sourceId) ?? null;
    }
}

/**
 * Converts a Gaia row into a positioned star when its parallax is positive.
 * @param row Validated Gaia source row.
 * @param lookups SIMBAD names, fallback temperatures and classifications keyed by Gaia source identifier.
 * @returns The star record, or undefined when distance cannot be derived.
 */
export function rowToStar(row: DeepReadonly<GaiaRow>, lookups: Readonly<StarLookupMaps>): StarRecord | undefined {
    if (row.parallax === null || row.parallax <= 0) {
        return undefined;
    }
    const distanceLy = (1000 / row.parallax) * LightYearPerParsec;
    const [x, y, z] = toCartesian(row.ra, row.dec, distanceLy);
    return {
        name: lookups.resolveName(row),
        x,
        y,
        z,
        temperature: lookups.resolveTemperature(row),
        sourceId: row.source_id,
        nature: lookups.resolveNature(row.source_id),
    };
}
/**
 * Converts Gaia rows to star records, omitting rows without a usable parallax.
 * @param rows Validated Gaia source rows.
 * @param lookups SIMBAD names, fallback temperatures and classifications keyed by Gaia source identifier.
 * @returns The available star records.
 */
export function rowsToStars(
    rows: DeepReadonly<Array<GaiaRow>>,
    lookups: Readonly<StarLookupMaps>,
): ReadonlyArray<StarRecord> {
    return rows.map((row) => rowToStar(row, lookups)).filter((star) => star !== undefined);
}
