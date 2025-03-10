if not exist .env (
  copy .env.example .env
)

docker-compose -f docker-compose.db.yml -f docker-compose.dev.yml up --build