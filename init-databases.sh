#!/bin/bash
set -e

DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# Функция для создания базы данных и пользователя если они не существуют
create_db_and_user() {
  local db_name=$1
  local user_name=$2
  local password=$3

  echo "Creating database $db_name with user $user_name"

  user_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$user_name'")
  
  if [ -z "$user_exists" ]; then
    psql -U postgres -c "CREATE USER $user_name WITH PASSWORD '$password' CREATEDB;"
    echo "User $user_name created with CREATEDB permission"
  else
    echo "User $user_name already exists"
    # Добавляем CREATEDB права существующему пользователю
    psql -U postgres -c "ALTER USER $user_name WITH CREATEDB;"
    echo "Added CREATEDB permission to $user_name"
  fi

  # Остальной код без изменений
  db_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'")
  
  if [ -z "$db_exists" ]; then
    psql -U postgres -c "CREATE DATABASE $db_name;"
    echo "Database $db_name created"
  else
    echo "Database $db_name already exists"
  fi

  psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $user_name;"
  echo "Granted permissions on $db_name to $user_name"
  
  # Дополнительные права на схему public (новая строка)
  psql -U postgres -d $db_name -c "GRANT ALL ON SCHEMA public TO $user_name;"
  psql -U postgres -d $db_name -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $user_name;"
  echo "Granted permissions on schema public in $db_name to $user_name"
}

create_db_and_user "storycraft_auth" "$DB_USER" "$DB_PASSWORD"
create_db_and_user "storycraft_story" "$DB_USER" "$DB_PASSWORD"
create_db_and_user "storycraft_user" "$DB_USER" "$DB_PASSWORD"

echo "All databases initialized using user $DB_USER"