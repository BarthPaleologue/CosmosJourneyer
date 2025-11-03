import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from astropy.table import Table

from gaia_explorer.metadata import SimbadMetadata
from gaia_explorer.temperatures import estimate_temperature_from_bp_rp
from gaia_explorer.temperatures import estimate_temperature_from_spectral_type
from gaia_explorer.temperatures import resolve_temperature_overrides


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
    def test_metadata_temperature_is_preferred(self) -> None:
        source_id = 2635476908753563008
        rows = Table(
            names=("source_id", "teff_k", "bp_rp"),
            dtype=("int64", "float64", "float64"),
        )
        rows.add_row((source_id, float("nan"), float("nan")))

        metadata = {
            source_id: SimbadMetadata(
                name="TRAPPIST-1",
                spectral_type="M8",
                object_type="PM*",
                effective_temperature=2450.0,
            )
        }

        overrides = resolve_temperature_overrides(rows, metadata)
        self.assertAlmostEqual(overrides[source_id], 2450.0)

    def test_spectral_type_heuristic(self) -> None:
        source_id = 123
        rows = Table(
            names=("source_id", "teff_k", "bp_rp"),
            dtype=("int64", "float64", "float64"),
        )
        rows.add_row((source_id, float("nan"), float("nan")))

        metadata = {
            source_id: SimbadMetadata(
                name="Cool Companion",
                spectral_type="M5V",
                object_type="*",
                effective_temperature=None,
            )
        }

        overrides = resolve_temperature_overrides(rows, metadata)
        self.assertIn(source_id, overrides)
        self.assertTrue(2500.0 < overrides[source_id] < 3100.0)

    def test_default_fallback_applied(self) -> None:
        source_id = 999
        rows = Table(
            names=("source_id", "teff_k", "bp_rp"),
            dtype=("int64", "float64", "float64"),
        )
        rows.add_row((source_id, float("nan"), float("nan")))

        metadata: dict[int, SimbadMetadata] = {
            source_id: SimbadMetadata(
                name="Mystery Star",
                spectral_type=None,
                object_type=None,
                effective_temperature=None,
            )
        }

        overrides = resolve_temperature_overrides(rows, metadata)
        self.assertEqual(overrides[source_id], 3500.0)


class SpectralTypeEstimationTests(unittest.TestCase):
    def test_white_dwarf_detection(self) -> None:
        self.assertAlmostEqual(estimate_temperature_from_spectral_type("DA5"), 5000.0)
        self.assertEqual(estimate_temperature_from_spectral_type("DB"), 12000.0)

    def test_main_sequence_interpolation(self) -> None:
        temp = estimate_temperature_from_spectral_type("K5")
        self.assertIsNotNone(temp)
        assert temp is not None
        self.assertTrue(3600.0 < temp < 4100.0)


if __name__ == "__main__":
    unittest.main()
