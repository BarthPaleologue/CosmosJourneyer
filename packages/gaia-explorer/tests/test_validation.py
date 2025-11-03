import json
import sys
import types
import unittest
from pathlib import Path

src_root = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(src_root))


def _ensure_stub(name: str) -> types.ModuleType:
    module = types.ModuleType(name)
    sys.modules[name] = module
    return module


if "astroquery" not in sys.modules:
    astroquery_module = _ensure_stub("astroquery")

    simbad_module = _ensure_stub("astroquery.simbad")

    class _DummySimbad:
        @staticmethod
        def add_votable_fields(*args, **kwargs):
            return None

    simbad_module.Simbad = _DummySimbad
    astroquery_module.simbad = simbad_module

    gaia_module = _ensure_stub("astroquery.gaia")
    class _DummyGaia:
        ROW_LIMIT = -1

    gaia_module.Gaia = _DummyGaia
    astroquery_module.gaia = gaia_module

from gaia_explorer.validation import MAIN_SEQUENCE_TEMP_MAX, validate_file


class ValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(self._testMethodName + "_cube.json")

    def tearDown(self) -> None:
        if self.tmp.exists():
            self.tmp.unlink()

    def write_payload(self, stars):
        payload = {
            "metadata": {"generated": "now"},
            "cubes": {"0:0:0": {"index": [0, 0, 0], "origin": [0, 0, 0], "stars": stars}},
        }
        self.tmp.write_text(json.dumps(payload))

    def test_successful_validation(self) -> None:
        self.write_payload(
            [
                {"name": "Barnard's Star", "relative_position": [0.5, 0.5, 0.5], "temperature": 3200.0, "nature": "main-sequence"},
                {"name": "Sirius B", "relative_position": [0.1, 0.1, 0.1], "temperature": 12000.0, "nature": "white-dwarf"},
            ]
        )
        result = validate_file(self.tmp)
        self.assertTrue(result.success)
        self.assertEqual(result.issues, [])

    def test_missing_temperature_is_reported(self) -> None:
        self.write_payload(
            [
                {"name": "Unknown", "relative_position": [0.5, 0.5, 0.5], "temperature": None, "nature": "main-sequence"}
            ]
        )
        result = validate_file(self.tmp)
        self.assertFalse(result.success)
        self.assertIn("Missing temperature", result.issues[0])

    def test_invalid_nature_flagged(self) -> None:
        self.write_payload(
            [
                {"name": "Mystery", "relative_position": [0.2, 0.2, 0.2], "temperature": 3200.0, "nature": "alien"}
            ]
        )
        result = validate_file(self.tmp)
        self.assertFalse(result.success)
        self.assertIn("Unexpected nature", result.issues[0])

    def test_main_sequence_temperature_bounds(self) -> None:
        self.write_payload(
            [
                {
                    "name": "Hot MS",
                    "relative_position": [0.3, 0.3, 0.3],
                    "temperature": MAIN_SEQUENCE_TEMP_MAX + 1000.0,
                    "nature": "main-sequence",
                }
            ]
        )
        result = validate_file(self.tmp)
        self.assertFalse(result.success)
        self.assertIn("Main-sequence", result.issues[0])


if __name__ == "__main__":
    unittest.main()
