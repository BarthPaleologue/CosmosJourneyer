import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from gaia_explorer.config import GridConfig
from gaia_explorer.records import StarRecord
from gaia_explorer.spatial import SpatialBinner


class SpatialBinnerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.grid = GridConfig(grid_size=10.0, half_extent=20.0)
        self.binner = SpatialBinner(self.grid)

    def test_add_star_within_bounds(self) -> None:
        star = StarRecord(name="Test", x=5.0, y=-5.0, z=5.0, temperature=None)
        added = self.binner.add_star(star)

        self.assertTrue(added)
        cube = self.binner.cubes["0:-1:0"]
        self.assertEqual(cube["index"], [0, -1, 0])
        stored = cube["stars"][0]
        self.assertEqual(stored["name"], "Test")
        self.assertAlmostEqual(stored["relative_position"][0], 0.5)
        self.assertAlmostEqual(stored["relative_position"][1], 0.5)
        self.assertAlmostEqual(stored["relative_position"][2], 0.5)

    def test_rejects_star_out_of_bounds(self) -> None:
        star = StarRecord(name="FarAway", x=25.0, y=0.0, z=0.0, temperature=None)
        added = self.binner.add_star(star)

        self.assertFalse(added)
        self.assertEqual(self.binner.cubes, {})


if __name__ == "__main__":
    unittest.main()
