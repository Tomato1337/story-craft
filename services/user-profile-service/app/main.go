package main

import (
	"log"
	"userService/router"
	"userService/utils"
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

	// Запуск сервера
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Не удалось запустить сервер: %v", err)
	}
}
