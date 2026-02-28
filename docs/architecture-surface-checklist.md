# Architecture Surface Checklist

Last updated: 2026-02-28

Use this checklist in every PR that touches runtime behavior.

- Routes changed
  - list each API/page route changed
- Tables/RPC changed
  - list table names, views, and RPC signatures touched
- Env vars changed
  - list name, default behavior, and failure behavior
- AI provider behavior changed
  - list model, timeout/retry, fallback changes
- Contract and generated docs updated
  - `docs/api-contracts-deep.md`
  - `docs/db-access-matrix.csv`
  - `docs/repo-deep-index.*`
  - `docs/architecture-bible.md`
