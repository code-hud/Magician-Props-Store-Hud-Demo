# Daily Deep Insights Self-Heal Memory

## Slack Feedback on Self-Heal PRs
<!-- Entries keyed by PR URL. Keep concise lessons from reviewer or Slack feedback. -->

### Global rules from reviewers (apply to all future runs)
- 2026-04-26 (thread reply by U08JK4C4LHE on bot msg ts 1777224947.367329): **"dont fix common shared libraries"** — Do NOT propose fixes that target shared/common libraries (e.g. `@guestyci/chassis`, `@guestyci/*` shared packages, monorepo `libs/common-*`, third-party-vendored code). Score such proposals as automatic FAIL even if root cause is correct. Fix the consumer (call site) or service-local code instead.
- 2026-04-26 (same thread): The prior PASS on `chassis.basicExternal` exceptions-as-control-flow falls under this rule — `f1540e5f8a393c83` is now permanently DISQUALIFIED, not just deferred for "repo mismatch".

### Per-PR feedback
<!-- (none yet — no replies on individual PRs #6008, #6009, #5800, #5791, #5684 in last 24h) -->

## Recent Insight Hashes
<!-- insight_hash | date | category | endpoint_or_function_id | service_name | result | pr_url_or_reason -->
f1540e5f8a393c83 | 2026-04-26T17:25:00Z | ErrorHotspot | 1572576 | outgoing-integration | DISQUALIFIED_SHARED_LIB | Reviewer feedback (2026-04-26 17:46 UTC): "dont fix common shared libraries". The chassis basicExternal/basicAuthorizationViaApiGateway refactor targets `@guestyci/chassis`, a shared library. Permanently disqualified.
dab6ffa76e78db0f | 2026-04-26T17:25:00Z | NPlusOne | 21244535 | pac-be-listings-consumer | NOT_INVESTIGATED | Skipped (Phase 3 stopped at first PASS in prior run).
f71b8f3cccdddeda | 2026-04-26T17:25:00Z | Bimodal | 1480312 | open-api-mailer | NOT_INVESTIGATED | Skipped (Phase 3 stopped at first PASS in prior run).
f5fdf8b865a73e65 | 2026-04-26T17:25:00Z | SilentErrorMasking | 21260674 | room-mailer | NOT_INVESTIGATED | Skipped (Phase 3 stopped at first PASS in prior run).
34284dfc2a03013f | 2026-04-26T17:25:00Z | DurationDrift | 1475698 | financials-mailer | NOT_INVESTIGATED | Skipped (Phase 3 stopped at first PASS in prior run).
