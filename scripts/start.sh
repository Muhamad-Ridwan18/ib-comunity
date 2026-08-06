#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
docker compose up -d
echo "Postgres up. Start API: cd backend && go run ./cmd/api"
echo "Start FE: cd frontend && npm run dev"
