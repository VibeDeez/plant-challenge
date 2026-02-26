#!/bin/bash
set -euo pipefail

# Usage:
#   notify_openclaw <event_type> <message>
# Event types: codex_start|codex_done|codex_fail|codex_stuck|codex_progress|security|cron|deploy|general

notify_openclaw() {
  local event_type="${1:-general}"
  local msg="${2:-}"
  [[ -n "$msg" ]] || return 0

  local channel="${OPENCLAW_NOTIFY_CHANNEL:-telegram}"
  local target="${OPENCLAW_NOTIFY_TARGET:-}"
  local thread_id=""

  case "$event_type" in
    codex_start|codex_done|codex_fail|codex_stuck|codex_progress) thread_id="${TELEGRAM_TOPIC_BUILDS:-}" ;;
    security) thread_id="${TELEGRAM_TOPIC_SECURITY:-}" ;;
    cron) thread_id="${TELEGRAM_TOPIC_CRON:-}" ;;
    deploy) thread_id="${TELEGRAM_TOPIC_DEPLOYS:-}" ;;
    *) thread_id="${TELEGRAM_TOPIC_GENERAL:-}" ;;
  esac

  # If a topic thread is configured, send directly to Telegram thread.
  if [[ -n "$target" && -n "$thread_id" ]]; then
    openclaw message send --channel "$channel" --target "$target" --thread-id "$thread_id" --message "$msg" >/dev/null 2>&1 || true
    return 0
  fi

  # Optional webhook path (no thread routing support)
  if [[ -n "${OPENCLAW_HOOK_TOKEN:-}" ]]; then
    curl -fsS -X POST "${OPENCLAW_HOOK_URL:-http://127.0.0.1:18789/hooks/wake}" \
      -H "Authorization: Bearer ${OPENCLAW_HOOK_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"${msg//\"/\\\"}\",\"mode\":\"now\"}" >/dev/null || true
    return 0
  fi

  # Fallback plain channel message (no thread)
  if [[ -n "$target" ]]; then
    openclaw message send --channel "$channel" --target "$target" --message "$msg" >/dev/null 2>&1 || true
    return 0
  fi

  echo "[notify:$event_type] $msg"
}
