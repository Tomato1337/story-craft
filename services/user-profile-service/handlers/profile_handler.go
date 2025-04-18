package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"github.com/monst/story-craft/services/user-profile-service/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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

	// Проверка обязательных полей
	if input.UserID == "" || input.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Обязательные поля UserID и Username должны быть заполнены"})
		return
	}

	userID := c.Param("user_id")

	// Проверка валидности UUID
	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный формат user_id: должен быть действительный UUID"})
		return
	}

	if userID != input.UserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id в URL и в теле запроса не совпадают"})
		return
	}

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
	// TODO договориться о формате передачи данных

	userID := c.Param("user_id")

	// Проверка валидности UUID
	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный формат user_id: должен быть действительный UUID"})
		return
	}

	var input struct {
		UserID      string                  `json:"user_id"`
		Username    *string                 `json:"username"`
		DisplayName *string                 `json:"display_name"`
		Bio         *string                 `json:"bio"`
		AvatarURL   *string                 `json:"avatar_url"`
		Preferences *map[string]interface{} `json:"preferences"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ошибка в формате JSON: проверьте правильность данных"})
		return
	}

	if input.UserID != userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id в URL и в теле запроса не совпадают"})
		return
	}

	// Проверка на пустой запрос обновления
	if input.Username == nil && input.DisplayName == nil &&
		input.Bio == nil && input.AvatarURL == nil && input.Preferences == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Необходимо указать хотя бы одно поле для обновления"})
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

	// Проверка на уникальность username при обновлении
	if input.Username != nil && *input.Username != profile.Username {
		var existingProfile models.Profile
		if err := h.db.Where("username = ?", *input.Username).First(&existingProfile).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": fmt.Sprintf("Пользователь с username '%s' уже существует", *input.Username)})
			return
		} else if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ошибка при проверке уникальности username"})
			return
		}
	}

	// Создаем map для обновления только указанных полей
	updates := make(map[string]interface{})

	if input.Username != nil {
		updates["username"] = *input.Username
	}
	if input.DisplayName != nil {
		updates["display_name"] = *input.DisplayName
	}
	if input.Bio != nil {
		updates["bio"] = *input.Bio
	}
	if input.AvatarURL != nil {
		updates["avatar_url"] = *input.AvatarURL
	}
	if input.Preferences != nil {
		updates["preferences"] = *input.Preferences
	}

	if err := h.db.Model(&profile).Updates(updates).Error; err != nil {
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
	if c.Request.Header.Get("x-user-authenticated") != "true" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Пользователь не авторизован"})
	}

	var input models.InputProfile
	input.UserID = c.Request.Header.Get("x-user-id")
	input.Email = c.Request.Header.Get("x-user-email")
	input.Role = c.Request.Header.Get("x-user-role")

	// Проверка обязательных полей
	if input.UserID == "" || input.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Обязательные поля UserID и Username должны быть заполнены"})
		return
	}

	// Получаем user_id из URL
	userID := c.Param("user_id")

	// Проверка валидности UUID
	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Некорректный формат user_id: должен быть действительный UUID"})
		return
	}

	if userID != input.UserID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id в URL и в теле запроса не совпадают"})
		return
	}

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

	c.JSON(http.StatusNoContent, nil)
}
