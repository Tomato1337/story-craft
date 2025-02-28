package utils

import (
	"fmt"
	"log"
	"os"
	"userService/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func SetupDatabase() (*gorm.DB, error) {
	if err := godotenv.Load(); err != nil {
		log.Println("Не удалось загрузить файл .env, используем переменные окружения системы")
	}
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s", os.Getenv("DB_HOST"), os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD"), os.Getenv("DB_NAME"), os.Getenv("DB_PORT"))
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// Миграция схемы
	if err := db.AutoMigrate(&models.Profile{}); err != nil {
		return nil, err
	}

	return db, nil
}
