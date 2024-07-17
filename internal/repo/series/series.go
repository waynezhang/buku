package series

import (
	"errors"
	"strings"
	"waynezhang/buku/internal/models"

	"gorm.io/gorm"
)

func GetAll(db *gorm.DB) []string {
	series := []string{}

	db.Model(&models.Book{}).
		Select("series").
		Where("series IS NOT null AND series != ''").
		Group("series").
		Order("series COLLATE NOCASE").
		Find(&series)
	return series
}

func Rename(db *gorm.DB, oldName string, newName string) error {
	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)
	if len(oldName) == 0 || len(newName) == 0 {
		return errors.New("Invalid series name")
	}
	db.Model(&models.Book{}).
		Where("series = ?", oldName).Update("series", newName)
	return nil
}
