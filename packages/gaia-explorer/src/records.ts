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
/**
 * Converts a Gaia row into a positioned star when its parallax is positive.
 * @param row Validated Gaia source row.
 * @param names Optional SIMBAD names keyed by Gaia source identifier.
 * @param temperatures Optional fallback temperatures keyed by Gaia source identifier.
 * @param natures Optional stellar classifications keyed by Gaia source identifier.
 * @returns The star record, or undefined when distance cannot be derived.
 */
export function rowToStar(
    row: DeepReadonly<GaiaRow>,
    names: DeepReadonly<Map<GaiaSourceId, string>> = new Map(),
    temperatures: DeepReadonly<Map<GaiaSourceId, number>> = new Map(),
    natures: DeepReadonly<Map<GaiaSourceId, StarNature>> = new Map(),
): StarRecord | undefined {
    if (row.parallax === null || row.parallax <= 0) {
        return undefined;
    }
    const distanceLy = (1000 / row.parallax) * LightYearPerParsec;
    const [x, y, z] = toCartesian(row.ra, row.dec, distanceLy);
    return {
        name: names.get(row.source_id) ?? row.designation ?? row.source_id,
        x,
        y,
        z,
        temperature: row.teff_k ?? temperatures.get(row.source_id) ?? null,
        sourceId: row.source_id,
        nature: natures.get(row.source_id) ?? null,
    };
}
/**
 * Converts Gaia rows to star records, omitting rows without a usable parallax.
 * @param rows Validated Gaia source rows.
 * @param names Optional SIMBAD names keyed by Gaia source identifier.
 * @param temperatures Optional fallback temperatures keyed by Gaia source identifier.
 * @param natures Optional stellar classifications keyed by Gaia source identifier.
 * @returns The available star records.
 */
export function rowsToStars(
    rows: DeepReadonly<Array<GaiaRow>>,
    names?: DeepReadonly<Map<GaiaSourceId, string>>,
    temperatures?: DeepReadonly<Map<GaiaSourceId, number>>,
    natures?: DeepReadonly<Map<GaiaSourceId, StarNature>>,
): ReadonlyArray<StarRecord> {
    return rows
        .map((row) => rowToStar(row, names, temperatures, natures))
        .filter((star): star is StarRecord => star !== undefined);
}
