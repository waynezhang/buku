package books

import (
	"errors"
	"slices"
	"strings"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/utils"

	"gorm.io/gorm"
)

type ReadStatus string

type StatRecord struct {
	ToRead   int64 `json:"to_read"`
	Reading  int64 `json:"reading"`
	Finished int64 `json:"finished"`
}

type YearRecord struct {
	Year  int `json:"year"`
	Count int `json:"count"`
	Ratio int `json:"ratio"`
}

func Create(db *gorm.DB, book *models.Book) (*models.Book, error) {
	book.ID = 0
	book.FixStatus()

	errs := book.Validate()
	if len(errs) > 0 {
		return nil, errors.New(errs[0])
	}

	ret := db.Create(book)
	if ret.Error != nil {
		return nil, ret.Error
	}
	if ret.RowsAffected == 0 {
		return nil, errors.New("DB error")
	}
	return book, nil
}

func Update(db *gorm.DB, id uint, book *models.Book) (*models.Book, error) {
	book.ID = id
	book.FixStatus()

	errs := book.Validate()
	if len(errs) > 0 {
		return nil, errors.New(errs[0])
	}

	ret := db.Model(&models.Book{}).
		Where("id = ?", id).
		Select("title", "author", "isbn", "series", "comments", "status", "started_at", "finished_at").
		Updates(book)
	if ret.Error != nil {
		return nil, ret.Error
	}
	if ret.RowsAffected == 0 {
		return nil, errors.New("ID not found")
	}
	return book, nil
}

func Delete(db *gorm.DB, id uint) error {
	ret := db.Delete(&models.Book{}, id)
	if ret.Error != nil {
		return ret.Error
	}
	if ret.RowsAffected == 0 {
		return errors.New("ID not found")
	}
	return nil
}

func GetAll(db *gorm.DB) []models.Book {
	books := []models.Book{}
	_ = db.Find(&books)

	return books
}

func GetByID(db *gorm.DB, id uint) *models.Book {
	books := []models.Book{}
	_ = db.Find(&books, id)

	if len(books) == 0 {
		return nil
	}
	return &books[0]
}

func GetByStatus(db *gorm.DB, status ReadStatus) []models.Book {
	books := []models.Book{}
	_ = db.Find(&books, "status = ?", status)

	return books
}

func CountStatInYears(db *gorm.DB) []YearRecord {
	records := []YearRecord{}
	db.
		Raw(`SELECT count(*) as count, strftime('%Y', finished_at)
				AS year FROM books
				WHERE year != 0
				GROUP BY year
				ORDER BY year DESC;`).
		Scan(&records)
	max := 10
	for _, r := range records {
		if r.Count > max {
			max = (r.Count + 9) / 10 * 10
		}
	}
	for i := range records {
		records[i].Ratio = records[i].Count * 100 / max
	}
	return records
}

func CountAll(db *gorm.DB) StatRecord {
	r := StatRecord{}
	db.Model(&models.Book{}).
		Where("status =?", models.STATUS_TO_READ).
		Count(&r.ToRead)
	db.Model(&models.Book{}).
		Where("status =?", models.STATUS_READING).
		Count(&r.Reading)
	db.Model(&models.Book{}).
		Where("status =?", models.STATUS_READ).
		Count(&r.Finished)
	return r
}

func GetByKeyword(db *gorm.DB, keyword string, sort string, order string, status string) []models.Book {
	keyword = strings.TrimSpace(keyword)
	books := []models.Book{}
	q := db.Model(&models.Book{}).
		Where(
			db.Where(
				"title LIKE ?", "%"+keyword+"%").
				Or("author LIKE ?", "%"+keyword+"%"),
		)
	if len(status) != 0 {
		q = q.Where("status = ?", status)
	}
	q.Order(sortCriteria(sort) + " COLLATE NOCASE " + utils.SortOrder(order)).
		Find(&books)
	return books
}

func GetByYear(db *gorm.DB, year int) []models.Book {
	books := []models.Book{}

	db.Model(&models.Book{}).
		Where("CAST(strftime('%Y', finished_at) AS INTEGER) = ?", year).
		Find(&books)

	return books
}

func GetByAuthor(db *gorm.DB, name string) []models.Book {
	books := []models.Book{}
	db.Model(&models.Book{}).Where("author = ?", name).Find(&books)
	return books
}

func GetBySeries(db *gorm.DB, name string, sort string, order string) []models.Book {
	books := []models.Book{}

	db.Model(&models.Book{}).
		Where("series = ?", name).
		Order(sortCriteria(sort) + " COLLATE NOCASE " + utils.SortOrder(order)).
		Find(&books)
	return books
}

func sortCriteria(str string) string {
	if slices.Index([]string{
		"title",
		"author",
		"created_at",
		"started_at",
		"finished_at",
	}, str) < 0 {
		return "title"
	}
	return str
}
