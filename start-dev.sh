#!/bin/bash

# if [ ! -f .env ]; then
#   echo "Creating .env file from .env.example"
#   cp .env.example .env
# fi

docker compose -f docker-compose.db.yml -f docker-compose.dev.yml up --build

