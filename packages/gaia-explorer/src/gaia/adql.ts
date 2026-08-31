import { computeParallaxMinMas } from "../config";
import type { QueryConfig } from "../config";
export function buildGaiaAdql(config: QueryConfig): string {
    const select = config.limit === undefined ? "SELECT" : `SELECT TOP ${config.limit}`;
    let adql = `${select}\n  gs.source_id,\n  gs.designation,\n  gs.ra,\n  gs.dec,\n  gs.parallax,\n  gs.parallax_over_error,\n  gs.ruwe,\n  gs.bp_rp,\n  ap.teff_gspphot AS teff_k\nFROM gaiadr3.gaia_source AS gs\nLEFT JOIN gaiadr3.astrophysical_parameters AS ap\n  ON ap.source_id = gs.source_id\nWHERE gs.parallax IS NOT NULL AND gs.parallax > ${computeParallaxMinMas(config).toFixed(6)} AND gs.parallax_over_error >= ${config.parallaxOverErrorMin} AND gs.ruwe <= ${config.ruweMax}`;
    if (config.temperatureMin !== undefined) {
        adql += `\nAND ap.teff_gspphot >= ${config.temperatureMin}`;
    }
    return adql;
}
