from __future__ import annotations

from pathlib import Path
import sys
import types

import pytest


def _ensure_stub_module(name: str) -> types.ModuleType:
    module = types.ModuleType(name)
    sys.modules[name] = module
    return module


if "astroquery" not in sys.modules:
    _ensure_stub_module("astroquery")

if "astroquery.gaia" not in sys.modules:
    gaia_module = _ensure_stub_module("astroquery.gaia")

    class _DummyGaia:
        ROW_LIMIT = -1

        @staticmethod
        def launch_job_async(*args, **kwargs):
            raise RuntimeError("Gaia network access is not available in tests.")

    gaia_module.Gaia = _DummyGaia
    sys.modules["astroquery"].gaia = gaia_module

if "astroquery.simbad" not in sys.modules:
    simbad_module = _ensure_stub_module("astroquery.simbad")

    class _DummySimbad:
        @staticmethod
        def add_votable_fields(*args, **kwargs):
            return None

        @staticmethod
        def query_objects(*args, **kwargs):
            raise RuntimeError("SIMBAD network access is not available in tests.")

    simbad_module.Simbad = _DummySimbad
    sys.modules["astroquery"].simbad = simbad_module


from gaia_explorer import cli


@pytest.fixture(autouse=True)
def stub_dependencies(monkeypatch):
    """Stub expensive dependencies so CLI tests stay fast and offline."""
    monkeypatch.setattr(cli, "query_gaia", lambda query: [])
    monkeypatch.setattr(cli, "resolve_simbad_metadata", lambda rows: {})
    monkeypatch.setattr(cli, "resolve_temperature_overrides", lambda rows, metadata_map: {})
    monkeypatch.setattr(
        cli,
        "iter_star_records",
        lambda rows, name_overrides=None, temperature_overrides=None, nature_overrides=None: iter(()),
    )
    monkeypatch.setattr(
        cli,
        "build_output",
        lambda cubes, grid, query, total, retained: {"payload": True},
    )

    class DummyBinner:
        def __init__(self, grid):
            self.cubes = []

        def add_star(self, star):
            return False

    monkeypatch.setattr(cli, "SpatialBinner", DummyBinner)


def test_cli_respects_absolute_output_paths(tmp_path, monkeypatch):
    json_path = tmp_path / "nested" / "stars.json"
    binary_path = tmp_path / "other" / "stars.bin.gz"

    captured = {}

    def fake_dump(payload, json_out, binary_out):
        captured["json"] = json_out
        captured["binary"] = binary_out

    monkeypatch.setattr(cli, "dump_outputs", fake_dump)

    cli.main(
        [
            "--output-json",
            str(json_path),
            "--binary-output",
            str(binary_path),
            "--cube-ly",
            "5",
            "--rmax-ly",
            "10",
            "--parallax-over-error-min",
            "8",
            "--ruwe-max",
            "1.4",
        ]
    )

    assert captured["json"] == json_path
    assert captured["binary"] == binary_path
    assert json_path.parent.exists()
    assert binary_path.parent.exists()


def test_cli_defaults_binary_path_next_to_json(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)

    json_path = Path("relative") / "stars.json"
    expected_json = tmp_path / json_path
    expected_binary = expected_json.with_suffix(expected_json.suffix + ".gz")

    captured = {}

    def fake_dump(payload, json_out, binary_out):
        captured["json"] = json_out
        captured["binary"] = binary_out

    monkeypatch.setattr(cli, "dump_outputs", fake_dump)

    cli.main(
        [
            "--output-json",
            str(json_path),
            "--cube-ly",
            "6",
            "--rmax-ly",
            "12",
        ]
    )

    assert captured["json"] == expected_json
    assert captured["binary"] == expected_binary
    assert expected_json.parent.exists()
