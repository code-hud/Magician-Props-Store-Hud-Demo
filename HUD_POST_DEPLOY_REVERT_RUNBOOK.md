# Hud Post-Deploy Revert — Demo Runbook

> The post-deploy counterpart to `hud-auto-fix.yml`. **Hud** detects a latency
> regression after a deploy, correlates it to the offending commit, and — from
> **production runtime data** — decides a revert is warranted. Hud then fires a
> thin GitHub workflow that **reverts the deploy and opens a PR**. It stops at
> "PR ready", exactly like the HudBot alert.

**Where the intelligence lives:** the detection + decision are **on Hud's side**.
The GitHub workflow is a dumb executor — it reverts the SHA Hud names and opens
the PR. No LLM, no analysis, no Hud query in CI. Deterministic and fast.

Two things get shown: **the alert** and **the PR**. Nothing is auto-deployed.

---

## 0. The real story this demo replays

Every number below is **real Hud data** on this app's `magician-props-api`
service (endpoint id `21311764`), not invented for the demo.

- **Baseline:** `GET /cart/suggestions` P90 = **53.23ms**.
- **Offending deploy: commit `1f176d3`** *"Rank cart suggestions by recent order
  popularity"* — the latest deploy on `main`.
- **Onset:** P90 jumps to **~2048ms (2.05s)** — a **+3,748%** step change, flat
  ever since. Matches the HudBot alert exactly.
- **Root cause function:** `ProductsService.findAll(search, category)`
  (`backend/src/products/products.service.ts:20`) — P90 **0.39ms → 2048ms**
  (73.5% of the slowdown).
- **Mechanism:** `1f176d3` (re)introduced a **per-product N+1**. `findAll` loops
  products calling `getProductOrderCount` for each; post-deploy that function
  shows **7,964,926** invocations and `Client.query()` **7,973,041** — the fan-out.
- **The twist worth narrating:** `95d5240` first added this N+1, a later commit
  (`ea4a12a`, the Kafka pipeline) removed it, and `1f176d3` **re-landed it** in a
  new PR. A regression that reappears is exactly what post-deploy monitoring —
  not a one-time code review — catches.
- Hud treats **cart / checkout** as protected flows → it reverts rather than
  wait for a slow forward-fix.

Reproduce the graph anytime:

```sql
SELECT toStartOfDay(hour_end) AS day,
  round(percentileMS(duration_buckets, 90), 2) AS p90_ms
FROM EndpointMetricsLowResolution
WHERE endpoint_id = 21311764 AND service_name = 'magician-props-api'
  AND hour_end >= toDateTime('2026-06-02') AND hour_end < now()
GROUP BY day ORDER BY day;
-- 53.23 ... 53.23 | (deploy) | 1706.42 -> 2048.08 flat
```

---

## 1. What gets built / where it lives

| File | Role |
|---|---|
| `.github/workflows/hud-post-deploy-revert.yml` | Thin executor: `git revert <bad_deploy_sha>` → open PR. Triggered by Hud. |
| `scripts/trigger-degradation-demo.sh` | Stands in for Hud's detector — fires the `hud-degradation` dispatch. |
| `HUD_POST_DEPLOY_REVERT_RUNBOOK.md` | This file. |

---

## 2. Prerequisites (one-time)

- **The workflow must be on `main`.** GitHub only triggers
  `repository_dispatch` / `workflow_dispatch` from the workflow file on the
  **default branch**. (Same reason `hud-auto-fix.yml` lives on `main`.)
- **No extra secrets** — the workflow uses only the default `GITHUB_TOKEN`
  (`contents: write` + `pull-requests: write`, declared in the workflow).
- The offending commit `1f176d3` must be in `main` history (it is — HEAD).

---

## 3. Run the demo

### Option A — the scripted dispatch (recommended, deterministic)

```bash
export GITHUB_TOKEN=ghp_...          # repo scope
export REPO=code-hud/Magician-Props-Store-Hud-Demo
./scripts/trigger-degradation-demo.sh   # fires the real 3,748% degradation payload
gh run watch -R "$REPO"
```

### Option B — manual dispatch

```bash
gh workflow run hud-post-deploy-revert.yml -R "$REPO" \
  -f endpoint="GET /cart/suggestions" \
  -f slowdown="[53.23ms -> 2.05s], [+3,748%] average P90 duration" \
  -f primary_function="ProductsService.findAll(search, category)" \
  -f baseline_p90_ms=53.23 -f degraded_p90_ms=2048 \
  -f bad_deploy_sha=1f176d3 \
  -f revert_file=backend/src/products/products.service.ts \
  -f deploy_timestamp="2026-06-08 18:17:48" \
  -f root_cause="Since the last deploy, findAll added heavier product filtering work."
```

The workflow reverts `1f176d3` on a `hud/revert/<n>` branch (clean revert — it's
the latest commit; `revert_file` is a fallback only if a future commit conflicts)
and opens a PR against `main`. Takes ~15s (no LLM).

---

## 4. What to show on screen (the narration)

1. **The alert (Slack).** The HudBot post-deploy alert: `GET /cart/suggestions
   slowed 8m after deployment`, `53.23ms → 2.05s`, `+3,748%`, root cause
   `ProductsService.findAll`, **status `⏪ Auto-reverted`**, and a **View Revert
   PR** button. Real Hud data. (n8n workflow *Send Auto-Revert Demo Alert* →
   `#test`.)
2. **The Hud graph (browser).** Endpoint P90: flat 53ms → vertical cliff to
   2.05s on June 8, flat ever since. One screenshot = the whole story.
3. **The revert PR (GitHub).** The auto-opened PR
   *"⏪ Revert: GET /cart/suggestions post-deploy regression"* — Root cause /
   Evidence (P90 numbers, primary function, correlated deploy) / Action, all
   from the alert payload. The deploy that looked fine on paper, undone. Merge =
   restore the endpoint.
4. (Optional) **The Actions run** — a 15s deterministic revert, no black box.

**Line to land:** the intelligence is Hud's (detect + correlate + decide from
runtime data); GitHub just executes the revert Hud asked for.

---

## 5. The contrast slide

| | **Static Code Review** | **Hud Auto-Fix** | **Hud Post-Deploy Revert** |
|---|---|---|---|
| When | pre-merge | on an issue | **post-deploy** |
| Decides | reads the diff | reads an issue | **Hud, from runtime + deploy correlation** |
| Output | risk comment | forward-fix PR | **revert PR (undo the exact deploy)** |

---

## 6. Reset between runs

```bash
gh pr list  -R "$REPO" --label hud --state open
gh pr close -R "$REPO" <n> --delete-branch
```

The demo never merges to `main`, so the degradation stays reproducible.

---

## 7. Wiring the alert to the PR

The n8n alert's **View Revert PR** button uses `REVERT_PR_URL` (top of its Code
node). After the workflow opens the PR, paste the PR URL there for a direct
link. (For a live run, open the PR first, then post the alert.)

---

## 8. Caveat

**Detector lookback is 24h** — Hud's real PostDeploymentFlowDegradation
scheduler only sees deploys within the last 1440 min. The `2026-06-08` deploy is
far older, so in the demo you trigger via the script rather than wait for the
live detector.
