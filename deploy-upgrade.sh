#!/usr/bin/env bash
# Run from the repository root on the server (same directory as docker-compose.yml).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

BRANCH="${DEPLOY_BRANCH:-master}"

git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

docker compose down
docker compose up --build -d --remove-orphans

if [[ -z "$(docker compose ps -q)" ]]; then
  echo "deploy-upgrade: no containers running" >&2
  exit 1
fi

docker compose ps
