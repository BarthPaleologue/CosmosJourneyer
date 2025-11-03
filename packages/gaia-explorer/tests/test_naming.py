import sys
import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path

from astropy.table import Table

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from gaia_explorer.naming import resolve_simbad_names


class ResolveSimbadNamesTests(unittest.TestCase):
    @patch("gaia_explorer.naming.Simbad")
    def test_enriches_with_proper_name(self, mock_simbad_cls: MagicMock) -> None:
        source_id = 2635476908753563008
        designation = "Gaia DR3 2635476908753563008"

        simbad_instance = mock_simbad_cls.return_value
        result_table = Table(
            names=("SCRIPT_NUMBER_ID", "MAIN_ID", "IDS"),
            dtype=("int32", "U32", "U128"),
        )
        result_table.add_row((1, "GJ 699", "GJ 699|LP 271-25"))
        simbad_instance.query_objects.return_value = result_table

        objectids_table = Table(names=("ID",), dtype=("U64",))
        objectids_table.add_row(("NAME Barnard's Star",))

        mock_simbad_cls.query_objectids.return_value = objectids_table

        rows = Table(
            names=("source_id", "designation"),
            dtype=("int64", "U40"),
        )
        rows.add_row((source_id, designation))

        names = resolve_simbad_names(rows, batch_size=10)

        self.assertEqual(names[source_id], "Barnard's Star")
        simbad_instance.query_objects.assert_called_once()
        mock_simbad_cls.query_objectids.assert_called()


if __name__ == "__main__":
    unittest.main()
