#!/bin/bash
# pre-commit — keep architecture/index docs in sync with src changes
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

changed_staged=$(git diff --cached --name-only || true)
if [ -z "$changed_staged" ]; then
  exit 0
fi

needs_index=false
for f in $changed_staged; do
  if [[ "$f" == src/* ]] || [[ "$f" == scripts/refresh-architecture-docs.py ]]; then
    needs_index=true
    break
  fi
done

if [ "$needs_index" = false ]; then
  exit 0
fi

echo "[pre-commit] src changes detected -> refreshing architecture docs"
python3 scripts/refresh-architecture-docs.py

git add \
  docs/repo-deep-index.md \
  docs/repo-deep-index.json \
  docs/db-access-matrix.csv \
  docs/api-contracts-deep.md \
  docs/api-contracts-deep.json \
  docs/architecture-bible.md \
  docs/sequence-diagrams.md \
  docs/sequence-diagrams.mmd || true

echo "[pre-commit] docs refreshed and staged"
