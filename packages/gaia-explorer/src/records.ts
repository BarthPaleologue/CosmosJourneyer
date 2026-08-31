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
export function rowToStar(
    row: GaiaRow,
    names: ReadonlyMap<GaiaSourceId, string> = new Map(),
    temperatures: ReadonlyMap<GaiaSourceId, number> = new Map(),
    natures: ReadonlyMap<GaiaSourceId, StarNature> = new Map(),
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
export function rowsToStars(
    rows: ReadonlyArray<GaiaRow>,
    names?: ReadonlyMap<GaiaSourceId, string>,
    temperatures?: ReadonlyMap<GaiaSourceId, number>,
    natures?: ReadonlyMap<GaiaSourceId, StarNature>,
): ReadonlyArray<StarRecord> {
    return rows
        .map((row) => rowToStar(row, names, temperatures, natures))
        .filter((star): star is StarRecord => star !== undefined);
}
