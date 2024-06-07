package books

import (
	"testing"
	"time"
	"waynezhang/buku/internal/infra/database"
	"waynezhang/buku/internal/models"

	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func testDB() *gorm.DB {
	db, _ := database.Load(":memory:")
	return db
}

func TestCreate1(t *testing.T) {
	db := testDB()

	b := &models.Book{}

	created, err := Create(db, b)
	assert.Nil(t, created)
	assert.NotNil(t, err)
}

func TestCreate2(t *testing.T) {
	db := testDB()

	b := &models.Book{}
	b.Title = "test 1"
	b.Author = "author 1"
	b.Series = "series 1"
	b.ISBN = "isbn 1"

	created, err := Create(db, b)
	assert.Equal(t, count(db), 1)

	assert.NotNil(t, created)
	assert.Nil(t, err)

	assert.Equal(t, b.Title, "test 1")
	assert.Equal(t, b.Author, "author 1")
	assert.Equal(t, b.Series, "series 1")
	assert.Equal(t, b.ISBN, "isbn 1")
	assert.Equal(t, b.Status, "to-read")
	assert.Nil(t, b.StartedAt)
	assert.Nil(t, b.FinishedAt)
}

func TestCreate3(t *testing.T) {
	db := testDB()

	b := &models.Book{}
	b.Title = "test 1"
	now := time.Now()
	b.StartedAt = &now

	created, err := Create(db, b)

	assert.NotNil(t, created)
	assert.Nil(t, err)

	assert.Equal(t, b.Title, "test 1")
	assert.Equal(t, b.Status, "reading")
	assert.Equal(t, b.StartedAt, &now)
	assert.Nil(t, b.FinishedAt)
}

func TestCreate4(t *testing.T) {
	db := testDB()

	b := &models.Book{}
	b.Title = "test 1"
	now := time.Now()
	b.FinishedAt = &now

	created, err := Create(db, b)

	assert.NotNil(t, created)
	assert.Nil(t, err)

	assert.Equal(t, b.Title, "test 1")
	assert.Equal(t, b.Status, "read")
	assert.Equal(t, b.StartedAt, &now)
	assert.Equal(t, b.FinishedAt, &now)
}

func TestUpdate(t *testing.T) {
	db := testDB()

	b, _ := Create(db, &models.Book{Title: "Test"})
	assert.Equal(t, b.ID, uint(1))
	assert.Equal(t, b.Title, "Test")
	assert.Equal(t, count(db), 1)

	b, _ = Update(db, b.ID, &models.Book{Title: "Test 1"})
	assert.Equal(t, b.ID, uint(1))
	assert.Equal(t, b.Title, "Test 1")
	assert.Equal(t, count(db), 1)

	b, _ = Update(db, b.ID, &models.Book{ID: 2, Title: "Test 2"})
	assert.Equal(t, b.ID, uint(1))
	assert.Equal(t, b.Title, "Test 2")
	assert.Equal(t, count(db), 1)
}

func TestDelete(t *testing.T) {
	db := testDB()

	b, _ := Create(db, &models.Book{Title: "Test"})
	assert.Equal(t, count(db), 1)

	Delete(db, b.ID)

	assert.Equal(t, count(db), 0)
}

func TestGetAll(t *testing.T) {
	db := testDB()

	_, _ = Create(db, &models.Book{Title: "Test 1"})
	_, _ = Create(db, &models.Book{Title: "Test 2"})
	_, _ = Create(db, &models.Book{Title: "Test 3"})
	assert.Equal(t, count(db), 3)

	books := GetAll(db)
	assert.Equal(t, len(books), 3)

	assert.Equal(t, books[0].Title, "Test 1")
	assert.Equal(t, books[1].Title, "Test 2")
	assert.Equal(t, books[2].Title, "Test 3")
}

func TestGetByID(t *testing.T) {
	db := testDB()

	_, _ = Create(db, &models.Book{Title: "Test 1"})
	_, _ = Create(db, &models.Book{Title: "Test 2"})
	_, _ = Create(db, &models.Book{Title: "Test 3"})

	assert.Equal(t, GetByID(db, 1).Title, "Test 1")
	assert.Equal(t, GetByID(db, 2).Title, "Test 2")
	assert.Equal(t, GetByID(db, 3).Title, "Test 3")
	assert.Nil(t, GetByID(db, 4))
}

func TestGetByStatus(t *testing.T) {
	db := testDB()

	now := time.Now()
	_, _ = Create(db, &models.Book{Title: "Test 1"})
	_, _ = Create(db, &models.Book{Title: "Test 2", StartedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 3", FinishedAt: &now})

	assert.Equal(t, GetByStatus(db, models.STATUS_TO_READ)[0].Title, "Test 1")
	assert.Equal(t, GetByStatus(db, models.STATUS_READING)[0].Title, "Test 2")
	assert.Equal(t, GetByStatus(db, models.STATUS_READ)[0].Title, "Test 3")
}

func TestCountStatInYearsAndCountAllAndGetByYear(t *testing.T) {
	db := testDB()

	now := time.Now()
	lastYear := now.AddDate(-1, 0, 0)
	_, _ = Create(db, &models.Book{Title: "Test 1"})
	_, _ = Create(db, &models.Book{Title: "Test 2"})

	_, _ = Create(db, &models.Book{Title: "Test 3", StartedAt: &lastYear})
	_, _ = Create(db, &models.Book{Title: "Test 4", FinishedAt: &lastYear})
	_, _ = Create(db, &models.Book{Title: "Test 5", FinishedAt: &lastYear})

	_, _ = Create(db, &models.Book{Title: "Test 6", FinishedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 7", FinishedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 8", FinishedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 9", FinishedAt: &now})

	rec := CountStatInYears(db)
	assert.Equal(t, len(rec), 2)
	assert.Equal(t, rec[0].Year, now.Year())
	assert.Equal(t, rec[0].Count, 4)
	assert.Equal(t, rec[0].Ratio, 40)
	assert.Equal(t, rec[1].Year, lastYear.Year())
	assert.Equal(t, rec[1].Count, 2)
	assert.Equal(t, rec[1].Ratio, 20)

	stat := CountAll(db)
	assert.Equal(t, stat.ToRead, int64(2))
	assert.Equal(t, stat.Reading, int64(1))
	assert.Equal(t, stat.Finished, int64(6))

	finishedInLastYear := GetByYear(db, lastYear.Year())
	assert.Equal(t, finishedInLastYear[0].Title, "Test 4")
	assert.Equal(t, finishedInLastYear[1].Title, "Test 5")

	finishedInThisYear := GetByYear(db, now.Year())
	assert.Equal(t, finishedInThisYear[0].Title, "Test 6")
	assert.Equal(t, finishedInThisYear[1].Title, "Test 7")
	assert.Equal(t, finishedInThisYear[2].Title, "Test 8")
	assert.Equal(t, finishedInThisYear[3].Title, "Test 9")
}

func TestGetByAuthorAndGetBySeries(t *testing.T) {
	db := testDB()

	now := time.Now()

	_, _ = Create(db, &models.Book{Title: "Test 1"})
	_, _ = Create(db, &models.Book{Title: "Test 2", Author: "Author 2", StartedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 3", Author: "Author 3", FinishedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 4", Author: "Author 4", FinishedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 5", Author: "Author 5", Series: "Series 5"})
	_, _ = Create(db, &models.Book{Title: "Test 6", Author: "Author 6", Series: "Series 6"})
	_, _ = Create(db, &models.Book{Title: "Test 7"})

	assert.Equal(t, GetByAuthor(db, "Author 2")[0].Title, "Test 2")
	assert.Equal(t, GetByAuthor(db, "Author 3")[0].Title, "Test 3")

	assert.Equal(t, GetBySeries(db, "Series 5")[0].Title, "Test 5")
	assert.Equal(t, GetBySeries(db, "Series 6")[0].Title, "Test 6")
}

func TestGetByKeyword(t *testing.T) {
	db := testDB()

	now := time.Now()

	_, _ = Create(db, &models.Book{Title: "Test 1"})
	_, _ = Create(db, &models.Book{Title: "Test 2", Author: "Author 2 key", StartedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 3", Author: "Author 3 key", FinishedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 4 key", Author: "Author 4", FinishedAt: &now})
	_, _ = Create(db, &models.Book{Title: "Test 5", Author: "Author 5 key"})
	_, _ = Create(db, &models.Book{Title: "Test 6", Author: "Author 6 key"})
	_, _ = Create(db, &models.Book{Title: "Test 7"})

	ret := GetByKeyword(db, "key", "title", "asc", "")
	assert.Equal(t, len(ret), 5)
	assert.Equal(t, ret[0].Title, "Test 2")
	assert.Equal(t, ret[1].Title, "Test 3")

	ret = GetByKeyword(db, "key", "title", "desc", "")
	assert.Equal(t, len(ret), 5)
	assert.Equal(t, ret[0].Title, "Test 6")
	assert.Equal(t, ret[1].Title, "Test 5")

	ret = GetByKeyword(db, "key", "author", "asc", "")
	assert.Equal(t, len(ret), 5)
	assert.Equal(t, ret[0].Title, "Test 2")
	assert.Equal(t, ret[1].Title, "Test 3")

	ret = GetByKeyword(db, "key", "created", "desc", "")
	assert.Equal(t, len(ret), 5)
	assert.Equal(t, ret[0].Title, "Test 6")
	assert.Equal(t, ret[1].Title, "Test 5")

	ret = GetByKeyword(db, "key", "created", "desc", "to-read")
	assert.Equal(t, len(ret), 2)
	assert.Equal(t, ret[0].Title, "Test 6")
	assert.Equal(t, ret[1].Title, "Test 5")

	ret = GetByKeyword(db, "", "created", "desc", "reading")
	assert.Equal(t, ret[0].Title, "Test 2")

	ret = GetByKeyword(db, "", "created", "desc", "read")
	assert.Equal(t, ret[0].Title, "Test 4 key")
	assert.Equal(t, ret[1].Title, "Test 3")
}

func TestSortCriteria(t *testing.T) {
	assert.Equal(t, sortCriteria(""), "title")
	assert.Equal(t, sortCriteria("xxx"), "title")
	assert.Equal(t, sortCriteria("title"), "title")
	assert.Equal(t, sortCriteria("author"), "author")
	assert.Equal(t, sortCriteria("created_at"), "created_at")
	assert.Equal(t, sortCriteria("started_at"), "started_at")
	assert.Equal(t, sortCriteria("finished_at"), "finished_at")
}

func count(db *gorm.DB) int {
	var c int64
	db.Model(&models.Book{}).Where("true").Count(&c)
	return int(c)
}
