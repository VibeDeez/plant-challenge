#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TASK_ID="${1:-}"
EXIT_CODE="${2:-1}"
[[ -n "$TASK_ID" ]] || { echo "Usage: $0 <task-id> <exit-code>"; exit 1; }

if [[ -f .clawdbot/config.env ]]; then
  # shellcheck disable=SC1091
  source .clawdbot/config.env
fi
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/notify-openclaw.sh"

notify() {
  local event_type="$1"
  local msg="$2"
  notify_openclaw "$event_type" "$msg"
}

STATUS="done"
[[ "$EXIT_CODE" == "0" ]] || STATUS="failed"

python3 - <<PY
import json, time
path = '.clawdbot/active-tasks.json'
with open(path) as f:
    data = json.load(f)
now = int(time.time()*1000)
for t in data.get('tasks', []):
    if t.get('id') == '$TASK_ID':
        t['status'] = '$STATUS'
        t['completedAt'] = now
        t['exitCode'] = int('$EXIT_CODE')
        t['lastEventAt'] = now
with open(path,'w') as f:
    json.dump(data, f, indent=2)
PY

if [[ "$STATUS" == "done" ]]; then
  notify codex_done "✅ Codex task finished: $TASK_ID"
else
  notify codex_fail "❌ Codex task failed: $TASK_ID (exit $EXIT_CODE)"
fi

echo "Task $TASK_ID marked $STATUS"
