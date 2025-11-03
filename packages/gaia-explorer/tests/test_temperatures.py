import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from gaia_explorer.temperatures import estimate_temperature_from_bp_rp


class TemperatureEstimationTests(unittest.TestCase):
    def test_colour_estimate_is_reasonable(self) -> None:
        hot = estimate_temperature_from_bp_rp(0.0)
        solar = estimate_temperature_from_bp_rp(0.82)
        cool = estimate_temperature_from_bp_rp(1.8)

        self.assertIsNotNone(hot)
        self.assertIsNotNone(solar)
        self.assertIsNotNone(cool)
        assert hot is not None and solar is not None and cool is not None

        self.assertGreater(hot, solar)
        self.assertGreater(solar, cool)
        self.assertTrue(5000.0 < solar < 6500.0)
        self.assertTrue(2800.0 < cool < 4200.0)

    def test_invalid_input_returns_none(self) -> None:
        self.assertIsNone(estimate_temperature_from_bp_rp(None))
        self.assertIsNone(estimate_temperature_from_bp_rp(float("nan")))


if __name__ == "__main__":
    unittest.main()
