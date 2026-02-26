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

STUCK_MINUTES="${STUCK_MINUTES:-15}"
PROGRESS_NOTIFY_MINUTES="${PROGRESS_NOTIFY_MINUTES:-5}"
STARTUP_GRACE_SECONDS="${STARTUP_GRACE_SECONDS:-30}"

export STUCK_MINUTES PROGRESS_NOTIFY_MINUTES STARTUP_GRACE_SECONDS

notify() {
  local event_type="$1"
  local msg="$2"
  notify_openclaw "$event_type" "$msg"
}

ALERTS="$(python3 - <<'PY'
import json, os, time, subprocess

path = '.clawdbot/active-tasks.json'
with open(path) as f:
    data = json.load(f)

changed = False
alerts = []

stuck_minutes = int(os.environ.get('STUCK_MINUTES', '15'))
progress_minutes = int(os.environ.get('PROGRESS_NOTIFY_MINUTES', '5'))
startup_grace_seconds = int(os.environ.get('STARTUP_GRACE_SECONDS', '30'))


def to_int(v, default=0):
    try:
        return int(v)
    except Exception:
        return default


def detect_exit_path(task):
    logs = task.get('logs') or {}
    if not isinstance(logs, dict):
        return None
    raw = logs.get('raw') or ''
    if raw and '/codex.log' in raw:
        return raw.replace('/codex.log', '/exit-code.txt')
    return None


for t in data.get('tasks', []):
    if t.get('status') != 'running':
        continue

    tid = t.get('id', 'unknown')
    sess = t.get('tmuxSession', '')
    now_ms = int(time.time() * 1000)

    alive = subprocess.run(
        ['tmux', 'has-session', '-t', sess],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    ).returncode == 0

    if not alive:
        exit_path = detect_exit_path(t)
        if exit_path and os.path.exists(exit_path):
            code = 1
            try:
                code = int((open(exit_path).read().strip() or '1'))
            except Exception:
                code = 1

            t['status'] = 'done' if code == 0 else 'failed'
            t['exitCode'] = code
            t['completedAt'] = now_ms
            t['lastEventAt'] = now_ms
            t['note'] = 'completed (detected by checker after tmux exit)'
            alerts.append(f"✅ Codex task finished: {tid}" if code == 0 else f"❌ Codex task failed: {tid} (exit {code})")
            changed = True
            continue

        started_at_ms = to_int(t.get('startedAt', now_ms), now_ms)
        if now_ms - started_at_ms < startup_grace_seconds * 1000:
            # Avoid false failure if checker runs before tmux child fully starts.
            continue

        t['status'] = 'failed'
        t['completedAt'] = now_ms
        t['note'] = 'tmux session exited unexpectedly'
        alerts.append(f"❌ Codex task failed: {tid} (tmux session missing)")
        changed = True
        continue

    # Alive: update last event from log mtime if available
    last_event_at = to_int(t.get('lastEventAt', t.get('startedAt', now_ms)), now_ms)
    jsonl = (t.get('logs') or {}).get('jsonl')
    if jsonl and os.path.exists(jsonl):
        mtime_ms = int(os.path.getmtime(jsonl) * 1000)
        if mtime_ms > last_event_at:
            t['lastEventAt'] = mtime_ms
            last_event_at = mtime_ms
            changed = True

    idle_minutes = (now_ms - last_event_at) / 60000.0
    if idle_minutes >= stuck_minutes and t.get('stuckNotified') is not True:
        t['stuckNotified'] = True
        t['status'] = 'stuck'
        t['note'] = f'No output for {int(idle_minutes)} minutes'
        t['completedAt'] = now_ms
        alerts.append(f"⚠️ Codex task may be stuck: {tid} (no output for {int(idle_minutes)}m, session: {sess})")
        changed = True
        continue

    # periodic progress heartbeat
    progress_every_ms = progress_minutes * 60 * 1000
    started_at_ms = to_int(t.get('startedAt', now_ms), now_ms)
    last_progress_ms = to_int(t.get('lastProgressNotifiedAt', started_at_ms), started_at_ms)
    runtime_min = int((now_ms - started_at_ms) / 60000)
    if now_ms - last_progress_ms >= progress_every_ms:
        t['lastProgressNotifiedAt'] = now_ms
        alerts.append(f"⏳ Codex task still running: {tid} (runtime {runtime_min}m, last output {int(idle_minutes)}m ago)")
        changed = True

if changed:
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

print("\n".join(alerts))
PY
)"

while IFS= read -r line; do
  [[ -n "$line" ]] || continue
  if [[ "$line" == "⏳"* ]]; then
    notify codex_progress "$line"
  elif [[ "$line" == "✅"* ]]; then
    notify codex_done "$line"
  elif [[ "$line" == "❌"* ]]; then
    notify codex_fail "$line"
  else
    notify codex_stuck "$line"
  fi
done <<< "$ALERTS"

echo "Codex task check complete."
