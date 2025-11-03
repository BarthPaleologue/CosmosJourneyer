"""Gaia archive query helpers."""
from __future__ import annotations

from astroquery.gaia import Gaia
from astropy.table import Table

from .config import QueryConfig


def build_adql(config: QueryConfig) -> str:
    """Create the ADQL statement for the configured Gaia query."""
    where_clauses = [
        "gs.parallax IS NOT NULL",
        f"gs.parallax > {config.parallax_min_mas:.6f}",
        f"gs.parallax_over_error >= {config.parallax_over_error_min}",
        f"gs.ruwe <= {config.ruwe_max}",
    ]
    adql = f"""
    SELECT
      gs.source_id,
      gs.designation,
      gs.ra,
      gs.dec,
      gs.parallax,
      gs.parallax_over_error,
      gs.ruwe,
      gs.bp_rp,
      ap.teff_gspphot AS teff_k
    FROM gaiadr3.gaia_source AS gs
    LEFT JOIN gaiadr3.astrophysical_parameters AS ap
      ON ap.source_id = gs.source_id
    WHERE {' AND '.join(where_clauses)}
    """.strip()

    if config.temperature_min is not None:
        adql += f"\nAND ap.teff_gspphot >= {config.temperature_min}"

    if config.limit is not None:
        adql += f"\nLIMIT {config.limit}"
    return adql


def query_gaia(config: QueryConfig) -> Table:
    """Run the Gaia ADQL query and return the result table."""
    Gaia.ROW_LIMIT = -1
    adql = build_adql(config)
    job = Gaia.launch_job_async(adql, dump_to_file=False)
    return job.get_results()
