import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from gaia_explorer.classification import classify_star
from gaia_explorer.metadata import SimbadMetadata


class ClassificationTests(unittest.TestCase):
    def test_white_dwarf_detection(self) -> None:
        meta = SimbadMetadata("WD Star", "DA4", "WD*", 12000.0)
        self.assertEqual(classify_star(meta, 12000.0), "white-dwarf")

    def test_neutron_star_detection(self) -> None:
        meta = SimbadMetadata("Pulsar", None, "Psr", None)
        self.assertEqual(classify_star(meta, None), "neutron-star")

    def test_black_hole_detection(self) -> None:
        meta = SimbadMetadata("Cygnus X-1", None, "BH", None)
        self.assertEqual(classify_star(meta, None), "black-hole")

    def test_default_main_sequence(self) -> None:
        meta = SimbadMetadata("Barnard's Star", "M4V", "PM*", 3200.0)
        self.assertEqual(classify_star(meta, 3200.0), "main-sequence")


if __name__ == "__main__":
    unittest.main()
