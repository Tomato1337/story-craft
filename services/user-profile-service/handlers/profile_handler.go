package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/monst/story-craft/services/user-profile-service/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProfileHandler struct {
	db *gorm.DB
}

func NewProfileHandler(db *gorm.DB) *ProfileHandler {
	return &ProfileHandler{db: db}
}

// Создание нового профиля
func (h ProfileHandler) CreateProfile(c *gin.Context) {
	var input models.InputProfile

	reqData := c.Request.Header.Get("x-user-object")

	var data map[string]interface{}
	err := json.Unmarshal([]byte(reqData), &data)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка в формате JSON: проверьте правильность данных"})
	}

	userID, ok := data["userId"].(string)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка: не удалось извлечь userId из заголовка"})
		return
	}
	input.UserID = userID

	body := c.Request.Body
	defer body.Close()

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка в формате JSON: проверьте правильность данных"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка: неверный формат user_id: " + userID})
		return
	}

	if input.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка: не передали username"})
		return
	}

	if input.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка: не передали email"})
		return
	}

	// Проверка на существование пользователя с таким username
	var existingProfile models.Profile
	if err := h.db.Where("user_id = ?", userUUID).First(&existingProfile).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь с таким username или email уже существует"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке существующих пользователей"})
		return
	}

	profile := models.Profile{
		UserID:    userID,
		Username:  input.Username,
		Email:     input.Email,
		AvatarURL: input.AvatarURL,
		Role:      input.Role,
	}

	if err := h.db.Create(&profile).Error; err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "Пользователь с такими данными уже существует"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось создать профиль пользователя"})
		}
		return
	}

	c.JSON(http.StatusCreated, profile)
}

// Получение профиля по user_id
func (h ProfileHandler) GetProfile(c *gin.Context) {
	userID := c.Params.ByName("user_id")

	var profile models.Profile
	if err := h.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Профиль не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при получении данных профиля"})
		}
		return
	}

	c.JSON(http.StatusOK, profile)
}

// Обновление профиля
func (h ProfileHandler) UpdateProfile(c *gin.Context) {
	var input models.UpdateProfile

	userID := c.Params.ByName("user_id")
	input.UserID = userID

	body := c.Request.Body
	defer body.Close()

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка в формате JSON: проверьте правильность данных"})
		return
	}

	var profile models.Profile
	if err := h.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Профиль не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при поиске профиля"})
		}
		return
	}

	if err := h.db.Model(&profile).Updates(input).Error; err != nil {
		if strings.Contains(err.Error(), "unique constraint") {
			c.JSON(http.StatusConflict, gin.H{"error": "Нарушение уникальности данных при обновлении"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при обновлении профиля"})
		}
		return
	}

	// Получаем обновленный профиль
	if err := h.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Профиль успешно обновлен, но возникла ошибка при получении обновленных данных"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// Удаление профиля
func (h ProfileHandler) DeleteProfile(c *gin.Context) {
	userID := c.Params.ByName("user_id")

	// Проверка существования профиля перед удалением
	var profile models.Profile
	if err := h.db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Профиль для удаления не найден"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при поиске профиля для удаления"})
		}
		return
	}

	if err := h.db.Delete(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при удалении профиля"})
		return
	}

	c.JSON(http.StatusNoContent, "Профиль успешно удалён")
}
