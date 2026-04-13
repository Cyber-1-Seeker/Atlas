#!/usr/bin/env bash
set -euo pipefail

# Usage (on server, in project folder):
#   chmod +x deploy.sh
#   ./deploy.sh
#
# Requires:
# - docker + docker compose plugin
# - docker login already done (or do it once manually)
# - .env.server exists (copy from .env.server.example)

COMPOSE_FILE="docker-compose.server.yml"
ENV_FILE=".env.server"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Missing $COMPOSE_FILE"
  exit 1
fi
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE (copy from .env.server.example)"
  exit 1
fi

echo "== Pull images =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo "== Start db =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d db

echo "== Run migrations =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend python manage.py migrate

echo "== Start/update all services =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

echo "== Status =="
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

