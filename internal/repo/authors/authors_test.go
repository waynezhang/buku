package authors

import (
	"testing"
	"waynezhang/buku/internal/infra/database"
	"waynezhang/buku/internal/models"

	"github.com/stretchr/testify/assert"
)

func TestSeries(t *testing.T) {
	db, _ := database.Load(":memory:")

	db.Create(&models.Book{Title: "Test 1"})
	db.Create(&models.Book{Title: "Test 2", Author: "Author 1"})
	db.Create(&models.Book{Title: "Test 3", Author: "Author 2"})
	db.Create(&models.Book{Title: "Test 4", Author: "Author 1"})
	db.Create(&models.Book{Title: "Test 4", Author: "Author 1"})
	db.Create(&models.Book{Title: "Test 4", Author: "Some Others"})

	s := GetAll(db, "", "")
	assert.Equal(t, len(s), 3)
	assert.Equal(t, s[0], "Author 1")
	assert.Equal(t, s[1], "Author 2")
	assert.Equal(t, s[2], "Some Others")

	s = GetAll(db, "1", "")
	assert.Equal(t, len(s), 1)
	assert.Equal(t, s[0], "Author 1")

	s = GetAll(db, "auth", "")
	assert.Equal(t, len(s), 2)
	assert.Equal(t, s[0], "Author 1")
	assert.Equal(t, s[1], "Author 2")

	s = GetAll(db, "auth", "desc")
	assert.Equal(t, len(s), 2)
	assert.Equal(t, s[0], "Author 2")
	assert.Equal(t, s[1], "Author 1")

	err := Rename(db, "", "Author Should Be Ignored")
	assert.NotNil(t, err)

	err = Rename(db, "Author Should Be Ignored", "")
	assert.NotNil(t, err)

	_ = Rename(db, "Author 2", "Author 3")

	s = GetAll(db, "", "")
	assert.Equal(t, len(s), 3)
	assert.Equal(t, s[0], "Author 1")
	assert.Equal(t, s[1], "Author 3")
	assert.Equal(t, s[2], "Some Others")

	_ = Rename(db, "Author 1", "Author 3")

	s = GetAll(db, "", "")
	assert.Equal(t, len(s), 2)
	assert.Equal(t, s[0], "Author 3")
	assert.Equal(t, s[1], "Some Others")
}
