import sys
import unittest
from unittest.mock import patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from gaia_explorer.temperatures import estimate_temperature_from_bp_rp
from gaia_explorer.temperatures import resolve_temperature_overrides
from astropy.table import Table


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


class TemperatureFallbackTests(unittest.TestCase):
    @patch("gaia_explorer.temperatures.Simbad")
    def test_trappist_temperature_within_expected_range(self, mock_simbad) -> None:
        source_id = 2635476908753563008
        designation = "Gaia DR3 2635476908753563008"

        gaia_rows = Table(
            names=("source_id", "designation", "teff_k", "bp_rp"),
            dtype=("int64", "U40", "float64", "float64"),
        )
        gaia_rows.add_row((source_id, designation, float("nan"), 4.9))

        simbad_rows = Table(
            names=("main_id", "mesfe_h.teff", "user_specified_id", "object_number_id"),
            dtype=("U32", "int32", "U40", "int32"),
        )
        simbad_rows.add_row(("TRAPPIST-1", 2400, designation, 253))

        simbad_instance = mock_simbad.return_value
        simbad_instance.query_objects.return_value = simbad_rows

        overrides = resolve_temperature_overrides(
            gaia_rows, name_overrides={source_id: "TRAPPIST-1"}, batch_size=10
        )

        self.assertIn(source_id, overrides)
        temperature = overrides[source_id]
        self.assertGreaterEqual(temperature, 2350.0)
        self.assertLessEqual(temperature, 2550.0)
        simbad_instance.query_objects.assert_called()


if __name__ == "__main__":
    unittest.main()
