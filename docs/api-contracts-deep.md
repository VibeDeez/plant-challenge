# API Contracts - Deep Pass

Last updated: 2026-03-04

Generated from route implementations. This is code-derived and should be treated as source-aligned reference.

## `/api/account/delete`
- File: `src/app/api/account/delete/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 400, 401, 429, 500
- Error messages observed: Internal server error; Invalid JSON body; Too many deletion requests. Please try again tomorrow.; Unauthorized
- Env vars: none

## `/api/account/email-change/request`
- File: `src/app/api/account/email-change/request/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 400, 401, 429, 500
- Error messages observed: Internal server error; Invalid JSON body; No existing email found for this account; Please enter a valid email address; That is already your current email; Too many email change requests. Please try again shortly.; Unauthorized; email is required
- Env vars: none

## `/api/account/export`
- File: `src/app/api/account/export/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 400, 401, 429, 500
- Error messages observed: Internal server error; Too many export requests. Please try again later.; Unauthorized
- Env vars: none

## `/api/account/password-reset/request`
- File: `src/app/api/account/password-reset/request/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 400, 401, 429, 500
- Error messages observed: Internal server error; No email found for this account; Too many reset requests. Please try again shortly.; Unauthorized
- Env vars: none

## `/api/account/sessions`
- File: `src/app/api/account/sessions/route.ts`
- Methods: GET
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 401, 500
- Error messages observed: Internal server error; Unauthorized
- Env vars: none

## `/api/account/sessions/revoke`
- File: `src/app/api/account/sessions/revoke/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 400, 401, 429, 500
- Error messages observed: Internal server error; Too many revoke requests. Please try again shortly.; Unauthorized
- Env vars: none

## `/api/e2e/cleanup`
- File: `src/app/api/e2e/cleanup/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 207, 400, 401, 404
- Error messages observed: Invalid JSON; Not authenticated; Not found
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

## `/api/sage/menu-max`
- File: `src/app/api/sage/menu-max/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: none or query-only
- Status codes observed: 400, 401, 422, 500, 502, 504
- Error messages observed: Could not read that link. Paste a screenshot/photo or use Find Recipe and I can analyze it.; I couldn't find recipe pages for that query yet. Try a more specific search phrase.; I found links but couldn't parse enough recipe detail. Try another query or paste a direct recipe link.; Internal server error; Invalid JSON body; Invalid context shape; Menu Max could not parse recommendations from the model output; Menu Max model is not configured; Menu Max model request failed; Menu Max request timed out. Please try again.; Menu Max returned an empty response; Please provide a valid menu or recipe URL.; Request body must be an object; Unauthorized; imageDataUrl is required when mode='image'; imageDataUrl must be a valid base64 data URL.; mode must be 'url', 'image', or 'discover'; query is required when mode='discover'; url is required when mode='url'
- Env vars: OPENROUTER_API_KEY, SAGE_MENU_OPENROUTER_MODEL, SAGE_MENU_TIMEOUT_MS

## `/api/voice-log`
- File: `src/app/api/voice-log/route.ts`
- Methods: POST
- Auth required: yes
- Request fields observed: audioBase64, format, locale
- Status codes observed: implicit 200 only
- Error messages observed: none literal
- Env vars: OPENROUTER_API_KEY, VOICE_OPENROUTER_MODEL, VOICE_OPENROUTER_TIMEOUT_MS

## Telemetry semantics for `/api/recognize` and `/api/sage`
- Log event name: `api_telemetry`
- Fields: `endpoint`, `status_code`, `latency_ms`, `timeout`, `fallback_used`, `parse_failed`, `request_size_bucket`
- `timeout` is true only for request abort timeout paths.
- `fallback_used` applies to Sage when malformed provider output triggers deterministic fallback response.
- `parse_failed` indicates provider payload or model payload parse failure and never logs request payload content.
