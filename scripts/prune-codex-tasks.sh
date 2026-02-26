#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

KEEP_DAYS="${1:-3}"
[[ -f .clawdbot/active-tasks.json ]] || { echo "No task registry found."; exit 0; }

python3 - <<PY
import json, time
path = '.clawdbot/active-tasks.json'
keep_days = int('$KEEP_DAYS')
cutoff = int(time.time()*1000) - keep_days*24*60*60*1000

with open(path) as f:
    data = json.load(f)

kept = []
removed = 0
for t in data.get('tasks', []):
    status = t.get('status')
    if status == 'running':
        kept.append(t)
        continue
    ts = t.get('completedAt') or t.get('startedAt') or 0
    if int(ts) >= cutoff:
        kept.append(t)
    else:
        removed += 1

data['tasks'] = kept
with open(path, 'w') as f:
    json.dump(data, f, indent=2)

print(f'Pruned {removed} old task entries; kept {len(kept)}')
PY
