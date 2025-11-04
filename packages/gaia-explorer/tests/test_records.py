import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from astropy.table import Table

from gaia_explorer.config import LIGHT_YEAR_PER_PARSEC
from gaia_explorer.records import iter_star_records


class RecordConversionTests(unittest.TestCase):
    def test_iter_star_records_applies_overrides_and_filters(self) -> None:
        rows = Table(
            names=("source_id", "parallax", "ra", "dec", "teff_k", "designation"),
            rows=[
                (123, 200.0, 0.0, 0.0, 5000.0, "Gaia DR3 123"),
                (456, -10.0, 0.0, 0.0, 4000.0, "Invalid"),
            ],
        )

        overrides = {123: "Custom Name"}

        records = list(iter_star_records(rows, name_overrides=overrides))

        self.assertEqual(len(records), 1)
        star = records[0]
        self.assertEqual(star.name, "Custom Name")

        expected_distance_pc = 1000.0 / 200.0
        expected_distance_ly = expected_distance_pc * LIGHT_YEAR_PER_PARSEC
        self.assertAlmostEqual(star.x, expected_distance_ly, places=6)
        self.assertAlmostEqual(star.y, 0.0, places=6)
        self.assertAlmostEqual(star.z, 0.0, places=6)


if __name__ == "__main__":
    unittest.main()
