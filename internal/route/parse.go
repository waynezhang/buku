package route

import (
	"strconv"
	"time"
	"waynezhang/buku/internal/models"

	"github.com/gofiber/fiber/v2"
)

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
func parseBodyAsBook(c *fiber.Ctx) (*models.Book, []string) {
	type request struct {
		Title      string `json:"title"`
		Author     string `json:"author"`
		Series     string `json:"series"`
		ISBN       string `json:"isbn"`
		Comments   string `json:"comments"`
		StartedAt  string `json:"started_at"`
		FinishedAt string `json:"finished_at"`
	}
	r := request{}
	_ = c.BodyParser(&r)

	book := models.Book{
		Title:    r.Title,
		Author:   r.Author,
		Series:   r.Series,
		ISBN:     r.ISBN,
		Comments: r.Comments,
	}

	errors := []string{}
	if len(r.StartedAt) > 0 {
		if date, err := time.Parse("2006-01-02", r.StartedAt); err != nil {
			errors = append(errors, "Invalid start date")
		} else {
			book.StartedAt = &date
		}
	} else {
		book.StartedAt = nil
	}
	if len(r.FinishedAt) > 0 {
		if date, err := time.Parse("2006-01-02", r.FinishedAt); err != nil {
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
