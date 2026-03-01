#!/bin/bash
# pre-push — Run E2E tests before allowing a push
# Installed automatically by the "prepare" npm script
# Skip with: git push --no-verify

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Skip E2E tests if no application code changed (only docs, configs, etc.)
main_branch="main"
changed_files=$(git diff "$main_branch"...HEAD --name-only 2>/dev/null || echo "")
has_app_changes=false
for f in $changed_files; do
  if [[ "$f" == src/* ]] || [[ "$f" == e2e/* ]]; then
    has_app_changes=true
    break
  fi
done

if [ "$has_app_changes" = false ] && [ -n "$changed_files" ]; then
  echo ""
  echo -e "${GREEN}✓ No src/ or e2e/ changes — skipping E2E tests${NC}"
  echo ""
  exit 0
fi

# Keep deep index docs fresh when src changes
if [ "$has_app_changes" = true ]; then
  if [ -f scripts/refresh-architecture-docs.py ]; then
    echo "[pre-push] refreshing deep index docs"
    python3 scripts/refresh-architecture-docs.py >/dev/null || {
      echo -e "${RED}✗ Failed to regenerate deep index docs${NC}"
      exit 1
    }
    # block push if regenerated docs are not committed
    if ! git diff --quiet -- docs/repo-deep-index.md docs/repo-deep-index.json docs/db-access-matrix.csv docs/api-contracts-deep.md docs/api-contracts-deep.json docs/architecture-bible.md; then
      echo -e "${YELLOW}Index docs changed after regeneration.${NC}"
      echo "Commit updated docs before pushing:"
      echo "  git add docs/repo-deep-index.md docs/repo-deep-index.json docs/db-access-matrix.csv docs/api-contracts-deep.md docs/api-contracts-deep.json docs/architecture-bible.md docs/db-access-matrix.csv docs/api-contracts-deep.md docs/api-contracts-deep.json docs/architecture-bible.md"
      echo "  git commit -m 'chore: refresh deep index docs'"
      exit 1
    fi
  fi
fi

echo ""
echo "=== Pre-Push: Running E2E Tests ==="
echo "    (skip with: git push --no-verify)"
echo ""

# Playwright owns web server lifecycle via e2e/playwright.config.ts webServer.
# Do not start another dev server here (prevents :3000 conflicts).

# Run coverage check (warnings only)
bash scripts/check-test-coverage.sh || true

# Run E2E tests
# If stale Next build artifacts cause chunk resolution issues, clear .next once.
if [ -d .next ]; then
  rm -rf .next
fi

echo "Running Playwright gate lane tests..."
if npx playwright test --config=e2e/playwright.config.ts \
  e2e/tests/auth.spec.ts \
  e2e/tests/navigation.spec.ts \
  e2e/tests/home.spec.ts \
  e2e/tests/add-plant.spec.ts \
  e2e/tests/circles.spec.ts \
  e2e/tests/circle-settings.spec.ts \
  e2e/tests/learn.spec.ts \
  e2e/tests/recognize.spec.ts; then
  echo ""
  echo -e "${GREEN}✓ All E2E tests passed — push allowed${NC}"
  echo ""
  exit 0
else
  echo ""
  echo -e "${RED}✗ E2E tests failed — push blocked${NC}"
  echo "Fix the failing tests and try again."
  echo ""
  exit 1
fi
