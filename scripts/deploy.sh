#!/usr/bin/env bash
# Deploy backend binary to Ubuntu VPS and restart systemd unit.
# Usage:
#   DEPLOY_HOST=user@api.example.com ./scripts/deploy.sh
# Optional:
#   DEPLOY_PATH=/var/www/ib-community
#   SERVICE=ib-api
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:?Set DEPLOY_HOST=user@host}"
REMOTE_PATH="${DEPLOY_PATH:-/var/www/ib-community}"
SERVICE="${SERVICE:-ib-api}"

echo "==> Building linux/amd64 API"
mkdir -p "$ROOT/backend/bin"
(
  cd "$ROOT/backend"
  GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/api ./cmd/api
)

echo "==> Uploading binary to ${HOST}:${REMOTE_PATH}/backend/bin/api"
ssh "$HOST" "mkdir -p '${REMOTE_PATH}/backend/bin' '${REMOTE_PATH}/storage'"
scp "$ROOT/backend/bin/api" "$HOST:${REMOTE_PATH}/backend/bin/api.new"
ssh "$HOST" "chmod +x '${REMOTE_PATH}/backend/bin/api.new' && mv '${REMOTE_PATH}/backend/bin/api.new' '${REMOTE_PATH}/backend/bin/api'"

echo "==> Restarting ${SERVICE}"
ssh "$HOST" "sudo systemctl restart '${SERVICE}' && sleep 2 && systemctl is-active '${SERVICE}'"

echo "==> Health check"
ssh "$HOST" "curl -fsS http://127.0.0.1:8080/ready | head -c 200; echo"

echo "Deploy complete."
