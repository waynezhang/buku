package repo

import (
	"testing"
	"waynezhang/buku/internal/infra/database"
	"waynezhang/buku/internal/models"

	"github.com/stretchr/testify/assert"
)

func Test(t *testing.T) {
	db, _ := database.Load(":memory:")

	db.Create(&models.Book{Title: "Test 1"})
	db.Create(&models.Book{Title: "Test 2", Author: "Author 1"})
	db.Create(&models.Book{Title: "Test 3", Author: "Author 2"})
	db.Create(&models.Book{Title: "Test 4", Author: "Author 1"})
	db.Create(&models.Book{Title: "Test 4", Author: "Author 1"})
	db.Create(&models.Book{Title: "Test 4", Author: "Some Others"})

	s := GetAll(db, "author", "", "")
	assert.Equal(t, len(s), 3)
	assert.Equal(t, s[0]["name"], "Author 1")
	assert.Equal(t, s[1]["name"], "Author 2")
	assert.Equal(t, s[2]["name"], "Some Others")
	assert.EqualValues(t, s[0]["count"], 3)
	assert.EqualValues(t, s[1]["count"], 1)
	assert.EqualValues(t, s[2]["count"], 1)

	s = GetAll(db, "author", "1", "")
	assert.Equal(t, len(s), 1)
	assert.Equal(t, s[0]["name"], "Author 1")

	s = GetAll(db, "author", "auth", "")
	assert.Equal(t, len(s), 2)
	assert.Equal(t, s[0]["name"], "Author 1")
	assert.Equal(t, s[1]["name"], "Author 2")

	s = GetAll(db, "author", "auth", "desc")
	assert.Equal(t, len(s), 2)
	assert.Equal(t, s[0]["name"], "Author 2")
	assert.Equal(t, s[1]["name"], "Author 1")

	err := Rename(db, "author", "", "Author Should Be Ignored")
	assert.NotNil(t, err)

	err = Rename(db, "author", "Author Should Be Ignored", "")
	assert.NotNil(t, err)

	_ = Rename(db, "author", "Author 2", "Author 3")
	s = GetAll(db, "author", "", "")
	assert.Equal(t, len(s), 3)
	assert.Equal(t, s[0]["name"], "Author 1")
	assert.Equal(t, s[1]["name"], "Author 3")
	assert.Equal(t, s[2]["name"], "Some Others")

	assert.EqualValues(t, s[0]["count"], 3)
	assert.EqualValues(t, s[1]["count"], 1)
	assert.EqualValues(t, s[2]["count"], 1)

	_ = Rename(db, "author", "Author 1", "Author 3")

	s = GetAll(db, "author", "", "")
	assert.Equal(t, len(s), 2)
	assert.Equal(t, s[0]["name"], "Author 3")
	assert.Equal(t, s[1]["name"], "Some Others")
	assert.EqualValues(t, s[0]["count"], 4)
	assert.EqualValues(t, s[1]["count"], 1)
}
