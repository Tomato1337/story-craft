package router

import (
	"github.com/monst/story-craft/services/user-profile-service/handlers"
	_ "github.com/monst/story-craft/services/user-profile-service/docs" // Импортируем Swagger документацию

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
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

func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	// Настройка CORS для API
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, PATCH, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Группа API для работы с профилями
	profiles := r.Group("/profiles")
	{
		profileHandler := handlers.NewProfileHandler(db)
		profiles.POST("/", profileHandler.CreateProfile)
		profiles.GET("/:user_id", profileHandler.GetProfile)
		profiles.PATCH("/:user_id", profileHandler.UpdateProfile)
		profiles.DELETE("/:user_id", profileHandler.DeleteProfile)
	}

	// Роут для Swagger UI
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	
	// Роут для JSON схемы Swagger
	r.GET("/schema", func(c *gin.Context) {
		c.Redirect(301, "/swagger/doc.json")
	})

	return r
}
