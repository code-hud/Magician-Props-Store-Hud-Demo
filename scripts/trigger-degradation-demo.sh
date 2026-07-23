#!/usr/bin/env bash
#
# trigger-degradation-demo.sh — stand in for Hud's post-deploy detector.
#
# In production, Hud detects the regression, correlates it to a deploy, decides
# a revert is warranted, and fires this `repository_dispatch` itself. For the
# demo, this script sends the same payload so the run is deterministic.
#
# The GitHub workflow (.github/workflows/hud-post-deploy-revert.yml) is a thin
# executor: it just reverts `bad_deploy_sha` and opens a PR. No analysis in CI.
#
# Payload carries the REAL degradation Hud observed on GET /cart/suggestions:
# P90 53.23ms -> 2.05s (+3,748%), a per-product N+1 in ProductsService.findAll
# reintroduced by the latest deploy, commit 1f176d3. See
# HUD_POST_DEPLOY_REVERT_RUNBOOK.md.
#
# Usage:
#   GITHUB_TOKEN=ghp_xxx REPO=owner/name ./scripts/trigger-degradation-demo.sh
#
# Env:
#   GITHUB_TOKEN  (required)  token with `repo` scope (repository_dispatch)
#   REPO          (required)  owner/name, e.g. code-hud/Magician-Props-Store-Hud-Demo
#   Overrides (optional): ENDPOINT, SLOWDOWN, PRIMARY_FUNCTION, BASELINE_P90_MS,
#     DEGRADED_P90_MS, BAD_DEPLOY_SHA, REVERT_FILE, DEPLOY_TIMESTAMP, ROOT_CAUSE,
#     ISSUE_LINK, ENDPOINT_LINK, TICKET_URL

set -euo pipefail

: "${GITHUB_TOKEN:?set GITHUB_TOKEN (repo scope)}"
: "${REPO:?set REPO=owner/name}"

# ── Real Hud-observed degradation (defaults) ─────────────────────────────────
ENDPOINT="${ENDPOINT:-GET /cart/suggestions}"
SLOWDOWN="${SLOWDOWN:-[53.23ms -> 2.05s], [+3,748%] average P90 duration}"
PRIMARY_FUNCTION="${PRIMARY_FUNCTION:-ProductsService.findAll(search, category)}"
BASELINE_P90_MS="${BASELINE_P90_MS:-53.23}"
DEGRADED_P90_MS="${DEGRADED_P90_MS:-2048}"
BAD_DEPLOY_SHA="${BAD_DEPLOY_SHA:-1f176d3}"
REVERT_FILE="${REVERT_FILE:-backend/src/products/products.service.ts}"
DEPLOY_TIMESTAMP="${DEPLOY_TIMESTAMP:-2026-06-08 18:17:48}"
ROOT_CAUSE="${ROOT_CAUSE:-Since the last deploy, findAll added heavier product filtering work, which explains the latency spike.}"
ISSUE_LINK="${ISSUE_LINK:-}"
ENDPOINT_LINK="${ENDPOINT_LINK:-}"
TICKET_URL="${TICKET_URL:-https://codehud.atlassian.net/browse/MAGSTORE-18}"

PAYLOAD=$(cat <<JSON
{
  "event_type": "hud-degradation",
  "client_payload": {
    "endpoint": "${ENDPOINT}",
    "slowdown": "${SLOWDOWN}",
    "primary_function": "${PRIMARY_FUNCTION}",
    "baseline_p90_ms": "${BASELINE_P90_MS}",
    "degraded_p90_ms": "${DEGRADED_P90_MS}",
    "bad_deploy_sha": "${BAD_DEPLOY_SHA}",
    "revert_file": "${REVERT_FILE}",
    "deploy_timestamp": "${DEPLOY_TIMESTAMP}",
    "root_cause": "${ROOT_CAUSE}",
    "issue_link": "${ISSUE_LINK}",
    "endpoint_link": "${ENDPOINT_LINK}",
    "ticket_url": "${TICKET_URL}"
  }
}
JSON
)

echo "🚨 Firing hud-degradation dispatch to ${REPO}"
echo "   ${ENDPOINT} — ${SLOWDOWN}"
echo "   revert deploy ${BAD_DEPLOY_SHA} @ ${DEPLOY_TIMESTAMP}"

HTTP=$(curl -s -o /tmp/dispatch_resp.txt -w "%{http_code}" -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  "https://api.github.com/repos/${REPO}/dispatches" \
  -d "${PAYLOAD}")

if [ "$HTTP" = "204" ]; then
  echo "✅ Dispatched. Watch the run:  gh run watch -R ${REPO}"
else
  echo "❌ Dispatch failed (HTTP $HTTP):"
  cat /tmp/dispatch_resp.txt
  exit 1
fi
