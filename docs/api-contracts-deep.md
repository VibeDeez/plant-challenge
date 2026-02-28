# API Contracts - Deep Pass

Last updated: 2026-02-28

Generated from route implementations. This is code-derived and should be treated as source-aligned reference.

## `/api/e2e/cleanup`
- File: `src/app/api/e2e/cleanup/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 207, 401, 404
- Error messages observed: Not authenticated; Not found
- Env vars: E2E_TEST, NODE_ENV

## `/api/e2e/login`
- File: `src/app/api/e2e/login/route.ts`
- Methods: GET
- Auth required: no/conditional
- Request fields observed: none or query-only
- Status codes observed: 401, 404, 500
- Error messages observed: Not found; Test credentials not configured
- Env vars: E2E_TEST, E2E_TEST_EMAIL, E2E_TEST_PASSWORD, NODE_ENV

## `/api/recognize`
- File: `src/app/api/recognize/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: image
- Status codes observed: implicit 200 only
- Error messages observed: none literal
- Env vars: OPENROUTER_API_KEY

## `/api/sage`
- File: `src/app/api/sage/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: implicit 200 only
- Error messages observed: none literal
- Env vars: OPENROUTER_API_KEY, SAGE_DETERMINISTIC_ONLY, SAGE_OPENROUTER_MODEL, SAGE_OPENROUTER_TIMEOUT_MS

## Telemetry semantics for `/api/recognize` and `/api/sage`
- Log event name: `api_telemetry`
- Fields: `endpoint`, `status_code`, `latency_ms`, `timeout`, `fallback_used`, `parse_failed`, `request_size_bucket`
- `timeout` is true only for request abort timeout paths.
- `fallback_used` applies to Sage when malformed provider output triggers deterministic fallback response.
- `parse_failed` indicates provider payload or model payload parse failure and never logs request payload content.
