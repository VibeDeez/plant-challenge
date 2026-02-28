# Model Usage Controls

Last updated: 2026-02-28

## `/api/recognize` policy
- Timeout: 15s
- Retry policy: 1 retry on transient 5xx
- Max request payload: 5MB request body and 4MB data URL guard
- Fallback behavior: return deterministic API error; user can continue with manual logging

## `/api/sage` policy
- Timeout: configurable via `SAGE_OPENROUTER_TIMEOUT_MS` (1s to 60s clamp)
- Retry policy: 1 retry on transient 5xx
- Max payload: bounded question/context validation
- Fallback behavior:
  - deterministic rules always checked first
  - optional deterministic-only mode via `SAGE_DETERMINISTIC_ONLY`
  - malformed model output returns safe uncertain response

## Operational controls
- `SAGE_DETERMINISTIC_ONLY=true` bypasses model calls for non-rule queries.
- `SAGE_OPENROUTER_MODEL` controls provider model selection.
- `OPENROUTER_API_KEY` required for model mode.
