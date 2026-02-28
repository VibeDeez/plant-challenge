# Feature Success Criteria

Last updated: 2026-02-28

## Add/Log flow
- Log completion from add screen: >= 85% of started sessions
- Median time to successful log: <= 25 seconds
- Duplicate confusion rate (support + in-app feedback): <= 3%

## Photo recognition flow
- Recognition success rate: >= 90%
- Parse-fallback rate: <= 5%
- Correction completion after recognition: >= 70%

## Circles join and scoring
- Join success for valid codes: >= 95%
- Invalid/expired/reused joins return deterministic reason: 100%
- Weekly leaderboard reconciliation errors: 0 unresolved > 24h

## Sage guidance flow
- Deterministic-rule question accuracy: 100%
- Non-deterministic fallback rate: <= 20% in normal mode
- p95 Sage response time: <= 3.5s

## PR expectation
Every feature PR must cite one criteria section above and include measured evidence.
