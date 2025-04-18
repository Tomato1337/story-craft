package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Profile struct {
	ID          uuid.UUID              `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID      string                 `gorm:"type:uuid;not null;unique;comment:'ID из Auth сервиса'" json:"user_id"`
	Username    string                 `gorm:"size:255;not null;unique" json:"username"`
	Email       string                 `gorm:"size:255;not null;unique" json:"email"`
	DisplayName string                 `gorm:"size:255" json:"display_name"`
	Bio         string                 `gorm:"type:text" json:"bio"`
	Role        string                 `gorm:"size:50;not null;default:'user'" json:"role"`
	AvatarURL   string                 `gorm:"size:255" json:"avatar_url"`
	Preferences map[string]interface{} `gorm:"type:jsonb;not null;default:'{}'" json:"preferences"`
	LastSeen    *time.Time             `gorm:"type:timestamp" json:"last_seen"`
	CreatedAt   time.Time              `gorm:"type:timestamp;not null;default:now()" json:"created_at"`
	UpdatedAt   time.Time              `gorm:"type:timestamp;not null;default:now()" json:"updated_at"`
	DeletedAt   gorm.DeletedAt         `gorm:"index" json:"-"`
}

type InputProfile struct {
	UserID    string `json:"userId"`
	Email     string `json:"email"`
	Role      string `json:"role"`
	Username  string `json:username`
	AvatarURL string `json:"avatarUrl"`
}

// TableName определяет имя таблицы в базе данных
func (Profile) TableName() string {
	return "user_profiles"
}
