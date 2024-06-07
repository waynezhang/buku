package series

import (
	"testing"
	"waynezhang/buku/internal/infra/database"
	"waynezhang/buku/internal/models"

	"github.com/stretchr/testify/assert"
)

func TestSeries(t *testing.T) {
	db, _ := database.Load(":memory:")

	db.Create(&models.Book{Title: "Test 1"})
	db.Create(&models.Book{Title: "Test 2", Series: "Series 1"})
	db.Create(&models.Book{Title: "Test 3", Series: "Series 2"})
	db.Create(&models.Book{Title: "Test 4", Series: "Series 1"})
	db.Create(&models.Book{Title: "Test 4", Series: "Series 1"})

	s := GetAll(db)
	assert.Equal(t, len(s), 2)
	assert.Equal(t, s[0], "Series 1")
	assert.Equal(t, s[1], "Series 2")

	err := Rename(db, "", "Series Should Be Ignored")
	assert.NotNil(t, err)

	err = Rename(db, " ", "Series Should Be Ignored")
	assert.NotNil(t, err)

	err = Rename(db, "Series Should Be Ignored", "")
	assert.NotNil(t, err)

	err = Rename(db, "Series Should Be Ignored", " ")
	assert.NotNil(t, err)

	_ = Rename(db, "Series 2", " Series 3 ")

	s = GetAll(db)
	assert.Equal(t, len(s), 2)
	assert.Equal(t, s[0], "Series 1")
	assert.Equal(t, s[1], "Series 3")

	_ = Rename(db, " Series 1 ", "Series 3")

	s = GetAll(db)
	assert.Equal(t, len(s), 1)
	assert.Equal(t, s[0], "Series 3")
}
