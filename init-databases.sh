#!/bin/bash
set -e

DB_USER=${DB_USER:-storycraft_user}
DB_PASSWORD=${DB_PASSWORD:-secure_password}

# Функция для создания базы данных и пользователя если они не существуют
create_db_and_user() {
  local db_name=$1
  local user_name=$2
  local password=$3

  echo "Creating database $db_name with user $user_name"

  user_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$user_name'")
  
  if [ -z "$user_exists" ]; then
    psql -U postgres -c "CREATE USER $user_name WITH PASSWORD '$password';"
    echo "User $user_name created"
  else
    echo "User $user_name already exists"
  fi

  db_exists=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'")
  
  if [ -z "$db_exists" ]; then
    psql -U postgres -c "CREATE DATABASE $db_name;"
    echo "Database $db_name created"
  else
    echo "Database $db_name already exists"
  fi

  psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $user_name;"
  echo "Granted permissions on $db_name to $user_name"
}

create_db_and_user "storycraft_auth" "$DB_USER" "$DB_PASSWORD"
create_db_and_user "storycraft_story" "$DB_USER" "$DB_PASSWORD"
create_db_and_user "storycraft_user" "$DB_USER" "$DB_PASSWORD"

echo "All databases initialized using user $DB_USER"
