#!/usr/bin/env bash
set -euo pipefail

ALLOW_NO_VERIFY=false
if [[ "${1:-}" == "--allow-no-verify" ]]; then
  ALLOW_NO_VERIFY=true
fi

echo "== ship:pr (fast local gate) =="
echo "1) Refresh docs"
npm run docs:refresh

echo "2) Typecheck"
npx tsc --noEmit

echo "3) Lint"
npm run lint

echo "4) Targeted tests (default set)"
npx playwright test e2e/tests/add-plant.spec.ts e2e/tests/circle-detail.spec.ts || {
  echo "\nTargeted tests failed."
  if [[ "$ALLOW_NO_VERIFY" == "true" ]]; then
    echo "--allow-no-verify set: continuing with warning."
  else
    echo "Re-run with --allow-no-verify only if explicitly approved."
    exit 1
  fi
}

echo "\n✅ ship:pr checks complete."
echo "Next: commit + push + open PR."
