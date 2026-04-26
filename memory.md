# Daily Deep Insights Self-Heal Memory

## Slack Feedback on Self-Heal PRs
<!-- Entries keyed by PR URL. Keep concise lessons from reviewer or Slack feedback. -->
- 2026-04-26: Scanned #bt (last 24h + recent weekly threads). PRs referenced in channel: #6008, #6009 (2026-04-07); #5800 (2026-03-17); #5791 (2026-03-16); #5684 (2026-03-04). No reviewer replies or human feedback found in any thread — all messages are bot-generated insight cards plus "Self-Heal PR opened" links. No actionable feedback to record.

## Recent Insight Hashes
<!-- insight_hash | date | category | endpoint_or_function_id | service_name | result | pr_url_or_reason -->
f1540e5f8a393c83 | 2026-04-26T17:25:00Z | ErrorHotspot | 1572576 | outgoing-integration | NO_PR_REPO_MISMATCH | Solution PASS (score 23, RootCauseDepth 8/Confidence 8/Impact 7): refactor exceptions-as-control-flow in @guestyci/chassis lib/authorization.js (basicExternal/basicAuthorizationViaApiGateway/authorization). 2.44M throws/3d in outgoing-integration alone (100% fn error, 0% endpoint error -> universally caught). Fix targets shared chassis package not present in /workspace (magician-props-store demo). PR not opened.
dab6ffa76e78db0f | 2026-04-26T17:25:00Z | NPlusOne | 21244535 | pac-be-listings-consumer | NOT_INVESTIGATED | Skipped (Phase 3 stopped at first PASS).
f71b8f3cccdddeda | 2026-04-26T17:25:00Z | Bimodal | 1480312 | open-api-mailer | NOT_INVESTIGATED | Skipped (Phase 3 stopped at first PASS).
f5fdf8b865a73e65 | 2026-04-26T17:25:00Z | SilentErrorMasking | 21260674 | room-mailer | NOT_INVESTIGATED | Skipped (Phase 3 stopped at first PASS).
34284dfc2a03013f | 2026-04-26T17:25:00Z | DurationDrift | 1475698 | financials-mailer | NOT_INVESTIGATED | Skipped (Phase 3 stopped at first PASS).
