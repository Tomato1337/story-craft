if not exist .env (
  copy .env.example .env
)
docker compose -f docker-compose.db.yml -f docker-compose.prod.yml up --build -d