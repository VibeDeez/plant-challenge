#!/bin/bash
# check-test-coverage.sh — Detect gaps in E2E test coverage
# This script warns but does not block. E2E tests themselves block the push.

set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "=== E2E Test Coverage Check ==="
echo ""

COVERAGE_MAP="e2e/coverage-map.json"
SPEC_DIR="e2e/tests"
gaps=0

# --- 1. Route coverage check ---
echo "Checking route coverage..."

# Find all page.tsx and route.ts files under src/app
routes=$(find src/app -name "page.tsx" -o -name "route.ts" 2>/dev/null | sort)

for file in $routes; do
  # Convert file path to route
  route=$(echo "$file" \
    | sed 's|src/app||' \
    | sed 's|/(protected)||' \
    | sed 's|/page\.tsx||' \
    | sed 's|/route\.ts||' \
    | sed 's|^$|/|')

  # Normalize empty to /
  if [ -z "$route" ]; then
    route="/"
  fi

  # Skip API routes that are mapped to null
  if [ -f "$COVERAGE_MAP" ]; then
    mapped=$(python3 -c "
import json, sys
with open('$COVERAGE_MAP') as f:
    m = json.load(f)
r = '$route'
if r in m:
    print(m[r] if m[r] else 'null')
else:
    print('MISSING')
" 2>/dev/null || echo "MISSING")

    if [ "$mapped" = "MISSING" ]; then
      echo -e "  ${YELLOW}⚠ UNCOVERED ROUTE:${NC} $route ($file)"
      echo "    → Add it to $COVERAGE_MAP and create tests"
      gaps=$((gaps + 1))
    elif [ "$mapped" = "null" ]; then
      : # Intentionally skipped route (e.g. /api/recognize)
    fi
  fi
done

# --- 2. Changed-file gap check ---
echo ""
echo "Checking changed files for test gaps..."

# Get the main branch name
main_branch="main"
changed_files=$(git diff "$main_branch"...HEAD --name-only 2>/dev/null || echo "")

if [ -n "$changed_files" ]; then
  for changed in $changed_files; do
    # Only check src/app files
    if [[ "$changed" == src/app/* ]] && [[ "$changed" == *page.tsx || "$changed" == *layout.tsx ]]; then
      # Check if a related spec was also modified
      spec_modified=false
      for spec in $(git diff "$main_branch"...HEAD --name-only -- "$SPEC_DIR" 2>/dev/null); do
        spec_modified=true
        break
      done

      if [ "$spec_modified" = false ]; then
        echo -e "  ${YELLOW}⚠ CHANGED WITHOUT TESTS:${NC} $changed"
        echo "    → Consider updating related spec files"
        gaps=$((gaps + 1))
      fi
    fi
  done
fi

echo ""
if [ $gaps -eq 0 ]; then
  echo -e "${GREEN}✓ No coverage gaps detected${NC}"
else
  echo -e "${YELLOW}⚠ Found $gaps potential coverage gap(s)${NC}"
  echo "  These are warnings — review and add tests if needed."
fi
echo ""
