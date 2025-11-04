import sys
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent.parent / "src"
sys.path.insert(0, str(PACKAGE_ROOT))
