#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

[[ -f .clawdbot/active-tasks.json ]] || { echo "No task registry found."; exit 0; }
if [[ -f .clawdbot/config.env ]]; then
  # shellcheck disable=SC1091
  source .clawdbot/config.env
fi
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/notify-openclaw.sh"

STUCK_MINUTES="${STUCK_MINUTES:-20}"
PROGRESS_NOTIFY_MINUTES="${PROGRESS_NOTIFY_MINUTES:-10}"
NOW="$(date +%s)"

notify() {
  local event_type="$1"
  local msg="$2"
  notify_openclaw "$event_type" "$msg"
}

python3 - <<PY
import json, time, os, subprocess
path = '.clawdbot/active-tasks.json'
with open(path) as f:
    data = json.load(f)
now = int(time.time())
changed = False
alerts = []

for t in data.get('tasks', []):
    if t.get('status') != 'running':
        continue
    tid = t.get('id')
    sess = t.get('tmuxSession', '')
    jsonl = t.get('logs', {}).get('jsonl')

    alive = subprocess.run(['tmux','has-session','-t',sess], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0
    if not alive:
        # Handle normal fast completion race: tmux can exit before checker runs.
        exit_path = None
        logs = t.get('logs', {})
        if isinstance(logs, dict):
            raw = logs.get('raw', '')
            if raw and '/codex.log' in raw:
                exit_path = raw.replace('/codex.log', '/exit-code.txt')
        if exit_path and os.path.exists(exit_path):
            try:
                code = int(open(exit_path).read().strip() or '1')
            except Exception:
                code = 1
            t['status'] = 'done' if code == 0 else 'failed'
            t['exitCode'] = code
            t['completedAt'] = int(time.time()*1000)
            t['note'] = 'completed (detected by checker after tmux exit)'
            if code == 0:
                alerts.append(f"✅ Codex task finished: {tid}")
            else:
                alerts.append(f"❌ Codex task failed: {tid} (exit {code})")
            changed = True
            continue

        t['status'] = 'failed'
        t['note'] = 'tmux session exited unexpectedly'
        t['completedAt'] = int(time.time()*1000)
        alerts.append(f"❌ Codex task failed: {tid} (tmux session missing)")
        changed = True
        continue

    last_event = t.get('lastEventAt', t.get('startedAt', int(time.time()*1000)))
    if jsonl and os.path.exists(jsonl):
        mtime_ms = int(os.path.getmtime(jsonl)*1000)
        if mtime_ms > last_event:
            t['lastEventAt'] = mtime_ms
            last_event = mtime_ms
            changed = True

    now_ms = int(time.time()*1000)
    age_min = (now_ms - int(last_event)) / 60000
    if age_min >= int(os.environ.get('STUCK_MINUTES','20')) and t.get('stuckNotified') != True:
        t['stuckNotified'] = True
        t['status'] = 'stuck'
        t['note'] = f'No output for {int(age_min)} minutes'
        alerts.append(f"⚠️ Codex task may be stuck: {tid} (no output for {int(age_min)}m, session: {sess})")
        changed = True
        continue

    # Progress heartbeat notification for long-running tasks
    progress_every_ms = int(os.environ.get('PROGRESS_NOTIFY_MINUTES','10')) * 60 * 1000
    started_at = int(t.get('startedAt', now_ms))
    last_progress = int(t.get('lastProgressNotifiedAt', started_at))
    runtime_min = int((now_ms - started_at) / 60000)
    if now_ms - last_progress >= progress_every_ms:
        t['lastProgressNotifiedAt'] = now_ms
        alerts.append(f"⏳ Codex task still running: {tid} (runtime {runtime_min}m, last output {int(age_min)}m ago)")
        changed = True

if changed:
    with open(path,'w') as f:
        json.dump(data, f, indent=2)

for a in alerts:
    print(a)
PY

# Send alerts printed by python
while IFS= read -r line; do
  [[ -n "$line" ]] || continue
  if [[ "$line" == "⏳"* ]]; then
    notify codex_progress "$line"
  elif [[ "$line" == "❌"* ]]; then
    notify codex_fail "$line"
  else
    notify codex_stuck "$line"
  fi
done < <(python3 - <<'PY'
import json
path = '.clawdbot/active-tasks.json'
with open(path) as f:
    data = json.load(f)
for t in data.get('tasks', []):
    if t.get('status') == 'stuck' and not t.get('stuckAlertDelivered'):
        print(f"⚠️ Codex task may be stuck: {t.get('id')} ({t.get('note','no output')})")
        t['stuckAlertDelivered'] = True
with open(path,'w') as f:
    json.dump(data, f, indent=2)
PY
)

echo "Codex task check complete."
