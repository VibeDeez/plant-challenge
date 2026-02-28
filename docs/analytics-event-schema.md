# Analytics Event Schema

Last updated: 2026-02-28

Canonical envelope for all analytics events:

```json
{
  "name": "log_success",
  "occurredAt": "2026-02-28T21:05:00.000Z",
  "source": "client|server|db_trigger",
  "actorId": "uuid-optional",
  "sessionId": "optional",
  "properties": {}
}
```

## Required properties by event

### `log_success`
- `entry_mode`: `manual|recognition|custom`
- `plant_count`: number
- `new_unique_count`: number
- `week_start`: `YYYY-MM-DD`

### `recognize_success`
- `recognized_count`: number
- `matched_count`: number
- `unmatched_count`: number

### `recognize_failure`
- `failure_reason`: `timeout|provider_error|no_plants_identified|invalid_payload|internal`
- `provider_status`: number (optional)
- `timeout`: boolean (optional)

### `recognize_corrected`
- `recognized_count`: number
- `selected_count`: number
- `correction_count`: number

### `join_circle`
- `circle_id`: uuid
- `join_result`: `success|invalid|expired|reused|error`

### `hit_30`
- `circle_id`: uuid
- `member_id`: uuid
- `week_start`: `YYYY-MM-DD`

## Emission baseline
- `/api/recognize` emits `recognize_success` and `recognize_failure`.
- `join_circle` and `hit_30` come from DB-triggered circle activity records and are normalized at export time.
- Frontend `log_success` and `recognize_corrected` are staged next and can use this schema immediately.
