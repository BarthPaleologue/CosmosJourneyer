import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from gaia_explorer.config import LIGHT_YEAR_PER_PARSEC, QueryConfig


class QueryConfigTests(unittest.TestCase):
    def test_parallax_min_mas_matches_radius(self) -> None:
        config = QueryConfig(
            radius_ly=50.0,
            parallax_over_error_min=10.0,
            ruwe_max=1.5,
            temperature_min=None,
            limit=None,
        )

        expected = 1000.0 / (config.radius_ly / LIGHT_YEAR_PER_PARSEC)
        self.assertAlmostEqual(config.parallax_min_mas, expected, places=6)


if __name__ == "__main__":
    unittest.main()
