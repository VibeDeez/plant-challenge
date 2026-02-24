#!/bin/bash
# pre-push — Run E2E tests before allowing a push
# Installed automatically by the "prepare" npm script

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "=== Pre-Push: Running E2E Tests ==="
echo ""

# Check if dev server is already running
DEV_RUNNING=false
if curl -s http://localhost:3000 > /dev/null 2>&1; then
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

  # Wait for server to be ready
  for i in $(seq 1 30); do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
      echo "Dev server ready."
      break
    fi
    if [ "$i" -eq 30 ]; then
      echo -e "${RED}✗ Dev server failed to start within 30s${NC}"
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
