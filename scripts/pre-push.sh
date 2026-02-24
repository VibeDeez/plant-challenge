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

echo ""
echo "=== Pre-Push: Running E2E Tests ==="
echo "    (skip with: git push --no-verify)"
echo ""

# Check if dev server is already running (use /auth which doesn't redirect)
DEV_RUNNING=false
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth 2>/dev/null | grep -q "200"; then
  DEV_RUNNING=true
  echo "Dev server already running on :3000"
fi

DEV_PID=""
cleanup() {
  if [ -n "$DEV_PID" ]; then
    echo "Stopping background dev server (PID $DEV_PID)..."
    kill "$DEV_PID" 2>/dev/null || true
    wait "$DEV_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# Start dev server in background if not running
if [ "$DEV_RUNNING" = false ]; then
  echo "Starting dev server..."
  npm run dev > /dev/null 2>&1 &
  DEV_PID=$!

  # Wait for server to be fully compiled and ready (check /auth returns 200)
  for i in $(seq 1 60); do
    status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/auth 2>/dev/null || echo "000")
    if [ "$status" = "200" ]; then
      echo "Dev server ready."
      break
    fi
    if [ "$i" -eq 60 ]; then
      echo -e "${RED}✗ Dev server failed to start within 60s${NC}"
      exit 1
    fi
    sleep 1
  done
fi

# Run coverage check (warnings only)
bash scripts/check-test-coverage.sh || true

# Run E2E tests
echo "Running Playwright tests..."
if npx playwright test --config=e2e/playwright.config.ts; then
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
