package router

import (
	"userService/handlers"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func SetupRouter(db *gorm.DB) *gin.Engine {
	r := gin.Default()

	profiles := r.Group("/")
	{
		profileHandler := handlers.NewProfileHandler(db)
		profiles.POST("/", profileHandler.CreateProfile)
		profiles.GET("/:user_id", profileHandler.GetProfile)
		profiles.PATCH("/:user_id", profileHandler.UpdateProfile)
		profiles.DELETE("/:user_id", profileHandler.DeleteProfile)
	}

	return r
}
