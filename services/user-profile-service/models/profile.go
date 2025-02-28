package models

import (
	"time"

	"gorm.io/gorm"
)

type Profile struct {
	ID          string                 `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	UserID      string                 `gorm:"type:uuid;not null;unique;comment:'ID из Auth сервиса'" json:"user_id"`
	Username    string                 `gorm:"size:255;not null;unique" json:"username"`
	DisplayName string                 `gorm:"size:255" json:"display_name"`
	Bio         string                 `gorm:"type:text" json:"bio"`
	AvatarURL   string                 `gorm:"size:255" json:"avatar_url"`
	Preferences map[string]interface{} `gorm:"type:jsonb;not null;default:'{}'" json:"preferences"`
	LastSeen    *time.Time             `gorm:"type:timestamp" json:"last_seen"`
	CreatedAt   time.Time              `gorm:"type:timestamp;not null;default:now()" json:"created_at"`
	UpdatedAt   time.Time              `gorm:"type:timestamp;not null;default:now()" json:"updated_at"`
	DeletedAt   gorm.DeletedAt         `gorm:"index" json:"-"`
}

// TableName определяет имя таблицы в базе данных
func (Profile) TableName() string {
	return "user_profiles"
}
