#!/bin/bash

if [ ! -f .env ]; then
  echo "Creating .env file from .env.example"
  cp .env.example .env
fi

set -a # Automatically export all variables
source .env
set +a
echo "API_GATEWAY_PORT in script: ${API_GATEWAY_PORT}" # Добавлено для проверки
echo "Running docker compose..."

docker compose -f docker-compose.db.yml -f docker-compose.dev.yml up --build

