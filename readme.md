# StoryCraft 🚀

StoryCraft - это платформа для совместного интерактивного творчества, где пользователи могут объединять усилия для создания увлекательных историй, глава за главой. Авторы начинают повествование, а сообщество предлагает свои варианты продолжения. Лучшие предложения выбираются путем голосования, и история продолжает расти, обогащаясь идеями множества участников.

## ✨ Особенности

*   **Коллективное творчество:** Начните историю и позвольте другим пользователям предлагать свои главы.
*   **Динамическое развитие сюжета:** После начальной главы история переходит в фазу предложений.
*   **Демократичный выбор:** Когда набирается как минимум два предложения для следующей главы, начинается фаза голосования.
*   **Бесконечное повествование:** Победившая глава становится частью канона, и цикл предложений/голосования повторяется.
*   **Микросервисная архитектура:** Гибкая и масштабируемая система, построенная на современных технологиях.

## 🏛️ Архитектура

StoryCraft использует микросервисную архитектуру, где каждый сервис отвечает за свою часть функциональности:

*   **API Gateway** (Node.js, Fastify): Единая точка входа для всех клиентских запросов. Маршрутизирует запросы к соответствующим микросервисам и агрегирует их ответы. Также предоставляет общую Swagger-документацию.
*   **Authentication Service** (Node.js, Express): Управляет регистрацией, аутентификацией пользователей и JWT-токенами.
*   **Story Service** (Node.js, Fastify): Основной сервис, отвечающий за логику создания историй, глав, предложений, фаз (предложения/голосование) и выбора победителей.
*   **User Profile Service** (Go, Gin): Управляет профилями пользователей, их данными и настройками.
*   **PostgreSQL**: Реляционная база данных, используемая всеми сервисами для хранения данных.

### Планируемые сервисы (Go):
*   Social Interaction Service
*   Notification Service
*   Media Service

## 🛠️ Технологии

*   **Бэкенд:**
    *   Node.js (TypeScript)
        *   Fastify (для API Gateway, Story Service)
        *   Express (для Auth Service)
    *   Go (Gin) (для User Profile Service и будущих сервисов)
    *   Prisma ORM (для взаимодействия с PostgreSQL в Node.js сервисах)
    *   GORM (для взаимодействия с PostgreSQL в Go сервисах)
*   **База данных:** PostgreSQL
*   **Контейнеризация:** Docker, Docker Compose
*   **Документация API:** Swagger (OpenAPI)

##  Prerequisites

Перед началом работы убедитесь, что у вас установлены:

*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/) (обычно устанавливается вместе с Docker Desktop)
*   [Git](https://git-scm.com/)

## 🚀 Запуск проекта

1.  **Клонируйте репозиторий:**
    ```bash
    git clone <URL_вашего_репозитория>
    cd storycraft
    ```

2.  **Настройка окружения:**
    Скопируйте файл `.env.example` в `.env` и при необходимости измените значения по умолчанию. Для локального запуска стандартные значения должны подойти.
    ```bash
    cp .env.example .env
    ```
    *В Linux/macOS, возможно, потребуется сделать скрипты запуска исполняемыми:*
    ```bash
    chmod +x start-dev.sh start-prod.sh stop-all.sh init-databases.sh
    ```

3.  **Запуск в режиме разработки (с hot-reloading для Node.js сервисов):**
    Этот режим использует `docker-compose.dev.yml`.
    ```bash
    # Для Linux/macOS
    bash start-dev.sh

    # Для Windows
    start-dev.bat
    ```
    Сервисы будут доступны по следующим адресам:
    *   **API Gateway:** `http://localhost:3000`
    *   **Swagger UI (Документация API):** `http://localhost:3000/docs`
    *   Auth Service (внутренний для Docker): `http://localhost:3001` (доступен через API Gateway)
    *   Story Service (внутренний для Docker): `http://localhost:3002` (доступен через API Gateway)
    *   User Profile Service (внутренний для Docker): `http://localhost:3003` (доступен через API Gateway)

4.  **Запуск в режиме продакшена:**
    Этот режим использует `docker-compose.prod.yml`.
    ```bash
    # Для Linux/macOS
    bash start-prod.sh

    # Для Windows
    start-prod.bat
    ```

5.  **Остановка всех сервисов:**
    ```bash
    # Для Linux/macOS
    bash stop-all.sh

    # Для Windows
    stop-all.bat
    ```

## 📖 Документация API

После запуска проекта документация API (Swagger UI) будет доступна по адресу `http://localhost:3000/docs`. API Gateway автоматически собирает схемы от `Auth Service` и `Story Service` по роутам `/schema`. Также API Gateway ждёт запуска всех сервисов прежде чем запуститься самому благодаря `healthcheck` в `docker-compose.(dev|prod).yml`.

## 🧩 Добавление нового микросервиса

1.  **Создайте директорию для нового сервиса:**
    Внутри папки `services/` создайте новую директорию, например, `services/new-feature-service`.

2.  **Разработайте ваш сервис:**
    Напишите код сервиса, используя предпочитаемый язык/фреймворк (например, Node.js/Fastify или Go/Gin).

3.  **Добавьте Dockerfile:**
    Создайте `Dockerfile.dev` (для разработки) и `Dockerfile.prod` (для продакшена) в директории вашего нового сервиса. Примеры можно найти в существующих сервисах.

4.  **Обновите Docker Compose файлы:**
    *   **`docker-compose.dev.yml`:**
        Добавьте конфигурацию для вашего нового сервиса (например, `new-feature-service-dev`). Укажите `build context`, `dockerfile`, `ports` (если нужен внешний доступ, обычно нет), `environment` (включая `DATABASE_URL`, если требуется), `networks` (обязательно `backend`), `depends_on` (например, `postgres`), и секцию `develop.watch` для hot-reloading.
    *   **`docker-compose.prod.yml`:**
        Добавьте аналогичную конфигурацию для продакшен-сборки (например, `new-feature-service`).

5.  **Интеграция с API Gateway (если сервис предоставляет HTTP API):**
    *   Откройте `services/api-gateway/src/config.ts`.
    *   Добавьте конфигурацию для вашего нового сервиса в объект `serviceConfig`. Укажите `prefix` (например, `/new-feature`), `upstream` (URL вашего сервиса, например, `http://new-feature-service-dev:${PORT_NEW_SERVICE}`), и `swaggerEnabled: true`, если у сервиса есть эндпоинт `/schema` для OpenAPI.
    *   Плагин `services/api-gateway/src/plugins/proxy.ts` автоматически подхватит эту конфигурацию.
    *   Если ваш новый сервис требует аутентификации, он может использовать заголовок `x-user-object`, который API Gateway передает от Auth Service.

6.  **Настройка базы данных (если требуется):**
    *   Если сервис использует свою базу данных, добавьте ее создание в `init-databases.sh`:
        ```bash
        create_db "storycraft_new_feature"
        ```
    *   Убедитесь, что переменная `DATABASE_URL` (или аналогичная) правильно сконфигурирована в `docker-compose.*.yml` для вашего сервиса, указывая на новую базу данных.
    *   Определите порт для нового сервиса (например, `NEW_FEATURE_SERVICE_PORT`) в файле `.env.example` и, соответственно, в вашем `.env`.

7.  **Перезапустите Docker Compose:**
    ```bash
    bash stop-all.sh
    bash start-dev.sh # или start-prod.sh
    ```