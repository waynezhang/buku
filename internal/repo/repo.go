package repo

import (
	"errors"
	"strings"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/utils"

	"gorm.io/gorm"
)

func GetAll(db *gorm.DB, column string, name string, order string) []map[string]any {
	result := []map[string]any{}

	q := db.Model(&models.Book{}).
		Select(column+" AS name", "COUNT(*) AS count")
	name = strings.TrimSpace(name)
	if len(name) == 0 {
		q = q.Where(column + " IS NOT null AND " + column + " != ''")
	} else {
		q = q.Where(column+" LIKE ?", "%"+name+"%")
	}
	q.Group(column).
		Order(column + " COLLATE NOCASE " + utils.SortOrder(order)).
		Find(&result)
	return result
}

func Rename(db *gorm.DB, column string, oldName string, newName string) error {
	oldName = strings.TrimSpace(oldName)
	newName = strings.TrimSpace(newName)
	if len(oldName) == 0 || len(newName) == 0 {
		return errors.New("Invalid column name")
	}

	db.Model(&models.Book{}).
		Where(column+" = ?", oldName).
		Update(column, newName)
	return nil
}
