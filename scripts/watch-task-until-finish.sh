#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TASK_ID="${1:-}"
INTERVAL_SEC="${2:-30}"
MAX_MINUTES="${3:-240}"

[[ -n "$TASK_ID" ]] || { echo "Usage: $0 <task-id> [interval-sec] [max-minutes]"; exit 1; }

end_ts=$(( $(date +%s) + MAX_MINUTES * 60 ))

get_status() {
  python3 - <<PY
import json
path = '.clawdbot/active-tasks.json'
try:
    data = json.load(open(path))
except Exception:
    print('missing')
    raise SystemExit(0)
for t in data.get('tasks', []):
    if t.get('id') == '$TASK_ID':
        print(t.get('status', 'unknown'))
        break
else:
    print('missing')
PY
}

while [[ $(date +%s) -lt $end_ts ]]; do
  bash "$ROOT_DIR/scripts/check-codex-tasks.sh" >/dev/null 2>&1 || true
  status="$(get_status)"
  if [[ "$status" != "running" ]]; then
    exit 0
  fi
  sleep "$INTERVAL_SEC"
done

# Final pass before exit timeout.
bash "$ROOT_DIR/scripts/check-codex-tasks.sh" >/dev/null 2>&1 || true
exit 0
