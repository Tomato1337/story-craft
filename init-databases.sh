#!/bin/bash
set -e

# Используем стандартные переменные окружения, предоставляемые образом postgres
# POSTGRES_USER будет содержать значение ${DB_USER} из вашего .env
# POSTGRES_PASSWORD будет содержать значение ${DB_PASSWORD} из вашего .env
# POSTGRES_DB будет содержать значение ${POSTGRES_DB} из вашего .env

# Функция для создания базы данных, если она не существует
create_db() {
  local db_name=$1
  local owner=$POSTGRES_USER # Используем пользователя, созданного entrypoint'ом

  echo "Checking database $db_name"
  
  # Подключаемся к базе данных по умолчанию ($POSTGRES_DB) для проверки
  db_exists=$(psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'")
  
  if [ -z "$db_exists" ]; then
    echo "Creating database $db_name owned by $owner"
    # Подключаемся к базе данных по умолчанию ($POSTGRES_DB) для создания новой БД
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "CREATE DATABASE $db_name OWNER $owner;"
    echo "Database $db_name created"
    
    # Предоставляем все права владельцу (подключаемся к созданной БД)
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db_name" -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $owner;"
    echo "Granted permissions on $db_name to $owner"

    # Дополнительные права на схему public (подключаемся к созданной БД)
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db_name" -c "GRANT ALL ON SCHEMA public TO $owner;"
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$db_name" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $owner;"
    echo "Granted permissions on schema public in $db_name to $owner"
  else
    echo "Database $db_name already exists"
  fi
}

# Создаем только те базы данных, которые нужны сервисам
create_db "storycraft_auth"
create_db "storycraft_story"
create_db "storycraft_user" 
create_db "$DB_NAME"

echo "Database initialization script finished for user $POSTGRES_USER."