# Codex + tmux Automation (v1)

This setup gives you:
- Detached Codex runs in tmux
- Task registry in `.clawdbot/active-tasks.json`
- Notifications on start/done/fail/stuck
- A checker script for periodic monitoring

## Files
- `scripts/codex-run-watch.sh` — launch a tracked Codex task in tmux
- `scripts/codex-task-finish.sh` — finalize state + notify
- `scripts/check-codex-tasks.sh` — detect stuck/failed tasks
- `.clawdbot/active-tasks.json` — task registry
- `.clawdbot/tasks/<task-id>/` — per-task logs and metadata

## Quick start

1. Create config:
```bash
cp .clawdbot/config.env.example .clawdbot/config.env
# set OPENCLAW_HOOK_TOKEN (recommended)
```

2. Create prompt file:
```bash
cat > /tmp/task.txt <<'EOF'
Implement X in Y files. Run tsc and summarize changes.
EOF
```

3. Launch task (preferred single entrypoint):
```bash
bash scripts/task.sh \
  --id feat-mobile-pass \
  --prompt-file /tmp/task.txt \
  --branch feat/mobile-pass
```

(Advanced/direct: `scripts/codex-run-watch.sh` is still available, but use `scripts/task.sh` by default.)

4. Check status:
```bash
bash scripts/check-codex-tasks.sh
cat .clawdbot/active-tasks.json
```

## Cron monitor (real-time profile)

Current recommended cadence:
- monitor job every **2 minutes**
- progress notifications every **5 minutes** (`PROGRESS_NOTIFY_MINUTES=5`)
- stuck threshold **15 minutes** (`STUCK_MINUTES=15`)

You can run checker manually:
```bash
cd ~/desktop/placeholder && bash scripts/check-codex-tasks.sh
```

## Telegram Topics routing (optional, recommended)

1. Create a Telegram supergroup and enable Topics.
2. Put your bot in the group.
3. Set `OPENCLAW_NOTIFY_TARGET` to the group chat id (example: `telegram:-1001234567890`).
4. Fill topic IDs in `.clawdbot/config.env`:
   - `TELEGRAM_TOPIC_BUILDS`
   - `TELEGRAM_TOPIC_SECURITY`
   - `TELEGRAM_TOPIC_CRON`
   - `TELEGRAM_TOPIC_DEPLOYS`
   - `TELEGRAM_TOPIC_GENERAL`

When topic IDs are set, Codex task notifications route into the Builds topic automatically.

## Notes
- This is intentionally simple and safe (no dangerous Codex flags).
- Topic routing uses `openclaw message send --thread-id` when configured.
- If no topic IDs are configured, notifications fall back to normal chat delivery.
