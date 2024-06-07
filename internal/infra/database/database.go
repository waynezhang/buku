package database

import (
	"waynezhang/buku/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Load(path string) (*gorm.DB, error) {
	db, err := gorm.Open(sqlite.Open(path))
	if err != nil {
		return nil, err
	}

	err = db.AutoMigrate(&models.Book{})
	if err != nil {
		return nil, err
	}
	return db, nil
}

func Nuke(db *gorm.DB) {
	db.Where("true").Delete(&models.Book{})
}
