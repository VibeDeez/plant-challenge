#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

WORKFLOW=".lobster/repo-bug-optimize.lobster.yaml"

if command -v lobster >/dev/null 2>&1; then
  echo "Running with lobster CLI..."
  lobster run "$WORKFLOW"
  exit 0
fi

if [ -f "$HOME/Desktop/lobster/bin/lobster.js" ]; then
  echo "Running with local lobster checkout at ~/Desktop/lobster ..."
  node "$HOME/Desktop/lobster/bin/lobster.js" run --file "$WORKFLOW"
  exit 0
fi

echo "Lobster CLI not found."
echo "Install options:"
echo "  1) Clone repo: git clone https://github.com/openclaw/lobster ~/Desktop/lobster && cd ~/Desktop/lobster && pnpm install && pnpm build"
echo "  2) Then rerun: bash scripts/run-lobster-check.sh"
exit 1
