"""Validation helpers for GaiaExplorer JSON outputs."""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

import json

DEFAULT_JSON_PATH = Path(__file__).resolve().parents[2] / "out" / "gaia_grid.json"

NATURE_TYPES = {"main-sequence", "white-dwarf", "neutron-star", "black-hole"}
TEMP_MIN = 800.0
TEMP_MAX = 40000.0
MAIN_SEQUENCE_TEMP_MIN = 900.0
MAIN_SEQUENCE_TEMP_MAX = 10000.0
WHITE_DWARF_TEMP_MIN = 2500.0
WHITE_DWARF_TEMP_MAX = 40000.0


@dataclass(slots=True)
class ValidationResult:
    success: bool
    issues: List[str]

    def __bool__(self) -> bool:  # pragma: no cover - convenience
        return self.success


def validate_file(path: Path) -> ValidationResult:
    data = json.loads(path.read_text())
    issues: List[str] = []
    temperatures: List[float] = []
    nature_counts: Dict[str, int] = {}

    for cube_id, cube in data.get("cubes", {}).items():
        for star in cube.get("stars", []):
            name = star.get("name", "<unknown>")
            nature = star.get("nature")
            temp = star.get("temperature")

            if nature is None:
                issues.append(f"Missing nature for {name} in cube {cube_id}")
            elif nature not in NATURE_TYPES:
                issues.append(f"Unexpected nature '{nature}' for {name} in cube {cube_id}")
            else:
                nature_counts[nature] = nature_counts.get(nature, 0) + 1

            if temp is None:
                issues.append(f"Missing temperature for {name} in cube {cube_id}")
            else:
                temperatures.append(temp)
                if temp < TEMP_MIN or temp > TEMP_MAX:
                    issues.append(f"Temperature {temp}K out of bounds for {name} in cube {cube_id}")

                if nature == "main-sequence" and not (MAIN_SEQUENCE_TEMP_MIN <= temp <= MAIN_SEQUENCE_TEMP_MAX):
                    issues.append(
                        f"Main-sequence star {name} has suspicious temperature {temp}K in cube {cube_id}"
                    )
                if nature == "white-dwarf" and temp < WHITE_DWARF_TEMP_MIN:
                    issues.append(f"White dwarf {name} has low temperature {temp}K in cube {cube_id}")

    if not data.get("metadata"):
        issues.append("Missing metadata block")

    success = not issues
    return ValidationResult(success=success, issues=issues)


def validate_default_output() -> ValidationResult:
    return validate_file(DEFAULT_JSON_PATH)


def main() -> None:  # pragma: no cover - CLI entry point
    result = validate_default_output()
    if result.success:
        print("Validation passed.")
    else:
        print("Validation failed:")
        for issue in result.issues:
            print(f" - {issue}")
        raise SystemExit(1)


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    main()
