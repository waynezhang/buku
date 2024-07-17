package authors

import (
	"errors"
	"strings"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/utils"

	"gorm.io/gorm"
)

func GetAll(db *gorm.DB, name string, order string) []string {
	authors := []string{}

	q := db.Model(&models.Book{}).
		Select("author")
	name = strings.TrimSpace(name)
	if len(name) == 0 {
		q = q.Where("author IS NOT null AND author != ''")
	} else {
		q = q.Where("author LIKE ?", "%"+name+"%")
	}
	q.Group("author").
		Order("author COLLATE NOCASE " + utils.SortOrder(order)).
		Find(&authors)

	return authors
}

func Rename(db *gorm.DB, oldName string, newName string) error {
	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)
	if len(oldName) == 0 || len(newName) == 0 {
		return errors.New("Invalid author name")
	}

	db.Model(&models.Book{}).
		Where("author = ?", oldName).
		Update("author", newName)
	return nil
}
