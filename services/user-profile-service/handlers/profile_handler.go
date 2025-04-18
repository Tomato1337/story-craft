package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
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

	requestUser := c.Request.Header.Get("x-user-object")
	if err := json.Unmarshal([]byte(requestUser), &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка в формате JSON: проверьте правильность данных"})
		return
	}

	if input.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка: не передали username"})
	}

	// Проверка на существование пользователя с таким username
	var existingProfile models.Profile
	if err := h.db.Where("username = ?", input.Username).First(&existingProfile).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Пользователь с таким username уже существует"})
		return
	} else if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке существующих пользователей"})
		return
	}

	profile := models.Profile{
		UserID:    input.UserID,
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

	c.JSON(http.StatusCreated, input)
}

// Получение профиля по user_id
func (h ProfileHandler) GetProfile(c *gin.Context) {
	var input models.InputProfile

	requestUser := c.Request.Header.Get("x-user-object")
	if err := json.Unmarshal([]byte(requestUser), &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка в формате JSON: проверьте правильность данных"})
		return
	}

	if input.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка: не передали username"})
	}

	var profile models.Profile
	if err := h.db.Where("username = ?", input.Username).First(&profile).Error; err != nil {
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
	var input models.InputProfile

	requestUser := c.Request.Header.Get("x-user-object")
	if err := json.Unmarshal([]byte(requestUser), &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка в формате JSON: проверьте правильность данных"})
		return
	}

	if input.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка: не передали username"})
	}

	var profile models.Profile
	if err := h.db.Where("username = ?", input.Username).First(&profile).Error; err != nil {
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
	if err := h.db.Where("username = ?", input.Username).First(&profile).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Профиль успешно обновлен, но возникла ошибка при получении обновленных данных"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// Удаление профиля
func (h ProfileHandler) DeleteProfile(c *gin.Context) {
	var input models.InputProfile

	requestUser := c.Request.Header.Get("x-user-object")
	if err := json.Unmarshal([]byte(requestUser), &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка в формате JSON: проверьте правильность данных"})
		return
	}

	if input.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка: не передали username"})
	}

	// Проверка существования профиля перед удалением
	var profile models.Profile
	if err := h.db.Where("username = ?", input.Username).First(&profile).Error; err != nil {
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

	c.JSON(http.StatusNoContent, nil)
}
