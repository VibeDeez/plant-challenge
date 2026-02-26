#!/bin/bash
set -euo pipefail

# Simple launcher to enforce the tracked Codex workflow.
# Usage:
#   bash scripts/task.sh --id <task-id> --prompt "..." [--branch <branch>] [--model <model>]
#   bash scripts/task.sh --id <task-id> --prompt-file /tmp/prompt.txt [--branch <branch>] [--model <model>]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TASK_ID=""
PROMPT_TEXT=""
PROMPT_FILE=""
BRANCH=""
MODEL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --id) TASK_ID="$2"; shift 2 ;;
    --prompt) PROMPT_TEXT="$2"; shift 2 ;;
    --prompt-file) PROMPT_FILE="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    --model) MODEL="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

if [[ -z "$TASK_ID" ]]; then
  TASK_ID="task-$(date +%Y%m%d-%H%M%S)"
fi

if [[ -n "$PROMPT_TEXT" && -n "$PROMPT_FILE" ]]; then
  echo "Use either --prompt or --prompt-file, not both."
  exit 1
fi

if [[ -z "$PROMPT_TEXT" && -z "$PROMPT_FILE" ]]; then
  echo "Provide --prompt or --prompt-file."
  exit 1
fi

TMP_PROMPT=""
if [[ -n "$PROMPT_TEXT" ]]; then
  mkdir -p .clawdbot/tasks/$TASK_ID
  TMP_PROMPT=".clawdbot/tasks/$TASK_ID/prompt.inline.txt"
  printf "%s\n" "$PROMPT_TEXT" > "$TMP_PROMPT"
  PROMPT_FILE="$TMP_PROMPT"
fi

CMD=(bash scripts/codex-run-watch.sh --id "$TASK_ID" --prompt-file "$PROMPT_FILE")
[[ -n "$BRANCH" ]] && CMD+=(--branch "$BRANCH")
[[ -n "$MODEL" ]] && CMD+=(--model "$MODEL")

"${CMD[@]}"

echo "Launched tracked task: $TASK_ID"
echo "Check status: bash scripts/check-codex-tasks.sh"
