#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TASK_ID=""
PROMPT_FILE=""
BRANCH=""
SESSION=""
MODEL=""
THINKING=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id) TASK_ID="$2"; shift 2 ;;
    --prompt-file) PROMPT_FILE="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --session) SESSION="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    --thinking) THINKING="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$TASK_ID" || -z "$PROMPT_FILE" ]]; then
  echo "Usage: $0 --id <task-id> --prompt-file <file> [--branch <name>] [--session <tmux-name>] [--model <model>] [--thinking <level>]"
  exit 1
fi

[[ -f "$PROMPT_FILE" ]] || { echo "Prompt file not found: $PROMPT_FILE"; exit 1; }

mkdir -p .clawdbot/tasks "$ROOT_DIR/test-results"
[[ -f .clawdbot/active-tasks.json ]] || echo '{"tasks":[]}' > .clawdbot/active-tasks.json

if [[ -f .clawdbot/config.env ]]; then
  # shellcheck disable=SC1091
  source .clawdbot/config.env
fi
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/notify-openclaw.sh"

MODEL="${MODEL:-${DEFAULT_MODEL:-gpt-5.3-codex}}"
SESSION="${SESSION:-codex-${TASK_ID}}"
TASK_DIR=".clawdbot/tasks/${TASK_ID}"
mkdir -p "$TASK_DIR"

PROMPT_DEST="$TASK_DIR/prompt.txt"
cp "$PROMPT_FILE" "$PROMPT_DEST"
JSONL_LOG="$TASK_DIR/codex-events.jsonl"
RAW_LOG="$TASK_DIR/codex.log"
STATUS_FILE="$TASK_DIR/exit-code.txt"
META_FILE="$TASK_DIR/meta.json"

STARTED_AT="$(date +%s)"

notify() {
  local event_type="$1"
  local msg="$2"
  notify_openclaw "$event_type" "$msg"
}

python3 - <<PY
import json, time
path = '.clawdbot/active-tasks.json'
with open(path) as f:
    data = json.load(f)
tasks = [t for t in data.get('tasks', []) if t.get('id') != '$TASK_ID']
tasks.append({
  'id': '$TASK_ID',
  'tmuxSession': '$SESSION',
  'agent': 'codex',
  'description': 'Task $TASK_ID',
  'repo': '$ROOT_DIR',
  'branch': '$BRANCH',
  'startedAt': int(time.time()*1000),
  'status': 'running',
  'lastEventAt': int(time.time()*1000),
  'notifyOnComplete': True,
  'logs': {'jsonl':'$JSONL_LOG','raw':'$RAW_LOG'}
})
with open(path,'w') as f:
    json.dump({'tasks': tasks}, f, indent=2)
PY

cat > "$META_FILE" <<EOF
{
  "id": "$TASK_ID",
  "session": "$SESSION",
  "model": "$MODEL",
  "branch": "$BRANCH",
  "startedAt": $STARTED_AT,
  "promptFile": "$PROMPT_DEST",
  "jsonl": "$JSONL_LOG",
  "raw": "$RAW_LOG"
}
EOF

CODEX_BIN="$(command -v codex || true)"
if [[ -z "$CODEX_BIN" ]]; then
  echo "codex binary not found in PATH"
  exit 1
fi

RUN_FILE="$ROOT_DIR/$TASK_DIR/run.sh"
cat > "$RUN_FILE" <<EOF
#!/bin/bash
set -euo pipefail
cd "$ROOT_DIR"
set -o pipefail
set +e
"$CODEX_BIN" exec --full-auto --json --model "$MODEL" - < "$PROMPT_DEST" 2>&1 | tee -a "$RAW_LOG" | tee "$JSONL_LOG" >/dev/null
ec=\$?
set -e
echo "\$ec" > "$STATUS_FILE"
bash "$ROOT_DIR/scripts/codex-task-finish.sh" "$TASK_ID" "\$ec"
EOF
chmod +x "$RUN_FILE"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "tmux session already exists: $SESSION"
  exit 1
fi

tmux new-session -d -s "$SESSION" "bash '$RUN_FILE'"

# Per-task local watcher (independent of OpenClaw cron/subagent timing)
nohup bash "$ROOT_DIR/scripts/watch-task-until-finish.sh" "$TASK_ID" 30 240 >/tmp/codex-task-watch.${TASK_ID}.log 2>&1 &

notify codex_start "🚀 Codex task started: $TASK_ID (session: $SESSION, model: $MODEL)"
echo "Started task $TASK_ID in tmux session $SESSION"
