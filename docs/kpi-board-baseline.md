# KPI Board Baseline

Last updated: 2026-02-28

## Goal
A reproducible baseline board for product health without requiring engineering context.

## KPI definitions

1) Completion rate
- Formula: users with >=1 `log_success` this week / active users this week
- Source events: `log_success`

2) Recognition success rate
- Formula: `recognize_success` / (`recognize_success` + `recognize_failure`) 
- Source events: `recognize_success`, `recognize_failure`

3) Repeat logging behavior
- Formula: users with 3+ `log_success` events in a rolling 7-day window / users with any `log_success`
- Source events: `log_success`

## Data source and refresh
- Source of truth: analytics event stream and circle activity events.
- Initial refresh cadence: daily at 06:00 CST.
- Manual reproducibility check: pick one week and recompute from raw events before sharing.

## Baseline board shape
- Date filter (last 7, 28, 90 days)
- KPI cards with numerator and denominator shown
- Trend sparkline for each KPI
- One plain-language interpretation line under each KPI
