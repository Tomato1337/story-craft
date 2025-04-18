package main

import (
	"log"
	"os"
	"github.com/monst/story-craft/services/user-profile-service/router"
	"github.com/monst/story-craft/services/user-profile-service/utils"
)

func main() {
	// Инициализация базы данных
	db, err := utils.SetupDatabase()
	if err != nil {
		log.Fatalf("Не удалось подключиться к базе данных: %v", err)
	}

	// Закрытие соединения с БД после завершения работы программы
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("Не удалось получить экземпляр *sql.DB: %v", err)
	}
	defer sqlDB.Close()

	// Инициализация роутера
	r := router.SetupRouter(db)

	// Запуск сервера на порту из env или 8080 по умолчанию
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Не удалось запустить сервер: %v", err)
	}
}
