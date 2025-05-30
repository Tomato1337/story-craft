FROM golang:1.23 AS builder

WORKDIR /app

# Сначала копируем только go.mod и go.sum для кэширования зависимостей
COPY go.mod go.sum ./
RUN go mod download

# Копируем остальные файлы проекта
COPY . .

# Генерация Swagger документации
RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN swag init -g app/main.go

# Компиляция с оптимизациями для продакшена
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o main ./app

# Используем минимальный образ для запуска
FROM alpine:3.19

# Установка сертификатов и часового пояса
RUN apk --no-cache add ca-certificates tzdata && \
    mkdir -p /app

WORKDIR /app

# Копируем только исполняемый файл из стадии сборки
COPY --from=builder /app/main .

# Создаем и переключаемся на непривилегированного пользователя
RUN adduser -D -H -h /app appuser && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

# Запуск приложения
CMD ["./main"]
