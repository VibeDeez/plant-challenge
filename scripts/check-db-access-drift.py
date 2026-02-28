#!/usr/bin/env python3
import csv
import sys
from pathlib import Path

MATRIX_PATH = Path("docs/db-access-matrix.csv")
ALLOWLIST_PATH = Path("docs/db-access-allowlist.txt")


def read_allowlist(path: Path) -> set[str]:
    if not path.exists():
        print(f"Missing allowlist file: {path}", file=sys.stderr)
        sys.exit(1)

    values: set[str] = set()
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        values.add(line)
    return values


def read_matrix_refs(path: Path) -> set[str]:
    if not path.exists():
        print(f"Missing db access matrix: {path}", file=sys.stderr)
        sys.exit(1)

    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        refs: set[str] = set()
        for row in reader:
            ref = (row.get("table_or_rpc") or "").strip()
            if ref:
                refs.add(ref)
    return refs


def main() -> int:
    known = read_allowlist(ALLOWLIST_PATH)
    used = read_matrix_refs(MATRIX_PATH)

    unknown = sorted(used - known)
    if unknown:
        print("Schema drift guard failed: unknown table/RPC references detected.")
        print("Add intentional new refs to docs/db-access-allowlist.txt.")
        for item in unknown:
            print(f"- {item}")
        return 1

    print("Schema drift guard passed: all table/RPC references are allowlisted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
