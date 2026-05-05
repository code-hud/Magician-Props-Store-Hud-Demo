#!/bin/bash
set -euo pipefail

# Magician Props Store - Startup Script
# This script starts the entire application with one command

echo ""
echo "🎩 Magician Props Store"
echo "========================"
echo ""
echo "Starting all services..."
echo ""

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed or not in PATH"
    exit 1
fi

# Derive the commit SHA from the current checkout and export it so docker-compose
# (which uses ${GIT_COMMIT_SHA:?...}) and the backend Dockerfile (ARG GIT_COMMIT_SHA)
# can pick it up. Hud sessions are tagged with this value so post-deploy regressions
# anchor to a real commit boundary.
if [ -z "${GIT_COMMIT_SHA:-}" ]; then
    if ! command -v git &> /dev/null; then
        echo "❌ Error: git is not installed and GIT_COMMIT_SHA was not set explicitly."
        exit 1
    fi
    GIT_COMMIT_SHA="$(git rev-parse --short HEAD 2>/dev/null || true)"
    if [ -z "$GIT_COMMIT_SHA" ]; then
        echo "❌ Error: could not derive GIT_COMMIT_SHA (not a git checkout?)."
        echo "   Set it explicitly:  GIT_COMMIT_SHA=<sha> ./START.sh"
        exit 1
    fi
fi
export GIT_COMMIT_SHA
echo "Hud commit_sha tag: $GIT_COMMIT_SHA"
echo ""

# Start services
docker-compose up --build

echo ""
echo "✅ Services started!"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo "Database: postgres://postgres:postgres@localhost:5432/magician_props_store"
echo ""
echo "Press Ctrl+C to stop the services"
echo ""
