package main

import (
	"log"
	"os"
	"github.com/monst/story-craft/services/user-profile-service/router"
	"github.com/monst/story-craft/services/user-profile-service/utils"
	
	// Импортируем документацию Swagger
	_ "github.com/monst/story-craft/services/user-profile-service/docs"
)

// @title           Story Craft User Profile Service API
// @version         1.0
// @description     API сервиса управления профилями пользователей Story Craft
// @termsOfService  http://swagger.io/terms/

// @contact.name   API Support
// @contact.url    http://www.story-craft.com/support
// @contact.email  support@story-craft.com

// @license.name   MIT
// @license.url    https://opensource.org/licenses/MIT

// @host      localhost:8080
// @BasePath  /

// @securityDefinitions.bearerAuth
// @type oauth2
// @tokenUrl https://story-craft.io/api/auth/login
// @in header
// @scheme bearer
// @bearerFormat JWT

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
	log.Printf("Сервер запускается на порту %s", port)
	log.Printf("Документация Swagger доступна по адресу http://localhost:%s/swagger/index.html", port)
	log.Printf("Схема Swagger доступна по адресу http://localhost:%s/schema", port)
	
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Не удалось запустить сервер: %v", err)
	}
}
