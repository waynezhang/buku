package database

import (
	"testing"
	"waynezhang/buku/internal/models"

	"github.com/stretchr/testify/assert"
)

func TestNuke(t *testing.T) {
	db, err := Load(":memory:")

	assert.NotNil(t, db)
	assert.Nil(t, err)

	db.Create(&models.Book{})
	db.Create(&models.Book{})
	db.Create(&models.Book{})

	var count int64

	db.Model(&models.Book{}).Where("true").Count(&count)
	assert.Equal(t, count, int64(3))

	Nuke(db)

	db.Model(&models.Book{}).Count(&count)
	assert.Equal(t, count, int64(0))
}
