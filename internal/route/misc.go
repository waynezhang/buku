package route

import (
	"strconv"
	"strings"
	"time"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/repo/books"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func parseFormAsBook(c *fiber.Ctx) (*models.Book, []string) {
	book := models.Book{
		Title:    getTrimmedFormValue(c, "title"),
		Author:   getTrimmedFormValue(c, "author"),
		Series:   getTrimmedFormValue(c, "series"),
		ISBN:     getTrimmedFormValue(c, "isbn"),
		Comments: getTrimmedFormValue(c, "comments"),
	}

	errors := []string{}
	startedAt := getTrimmedFormValue(c, "startedAt")
	if len(startedAt) > 0 {
		if date, err := time.Parse("2006-01-02", startedAt); err != nil {
			errors = append(errors, "Invalid start date")
		} else {
			book.StartedAt = &date
		}
	} else {
		book.StartedAt = nil
	}
	finishedAt := getTrimmedFormValue(c, "finishedAt")
	if len(finishedAt) > 0 {
		if date, err := time.Parse("2006-01-02", finishedAt); err != nil {
			errors = append(errors, "Invalid finish date")
		} else {
			book.FinishedAt = &date
		}
	} else {
		book.FinishedAt = nil
	}

	errors = append(book.Validate(), errors...)

	return &book, errors
}

func getTrimmedFormValue(c *fiber.Ctx, key string) string {
	return strings.TrimSpace(c.FormValue(key))
}

func withQueryBook(db *gorm.DB, c *fiber.Ctx, fn func(*models.Book) error) error {
	id := parseID(c)
	if id == nil {
		return renderError(c, "Book is not found")
	}

	book := books.GetByID(db, *id)
	if book != nil {
		return fn(book)
	} else {
		return renderError(c, "Book is not found")
	}
}

func parseID(f *fiber.Ctx) *uint {
	id, err := strconv.ParseUint(f.Params("id"), 10, 64)
	if err != nil {
		return nil
	}
	uid := uint(id)
	return &uid
}

func parseYear(f *fiber.Ctx) int {
	year, _ := strconv.Atoi(f.Params("year"))
	return year
}
