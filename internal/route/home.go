package route

import (
	"time"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/repo/books"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func renderHomePage(c *fiber.Ctx, db *gorm.DB) error {
	counts := books.CountAll(db)
	stat := books.CountStatInYears(db)
	reading_books := books.GetByStatus(db, models.STATUS_READING)
	year := time.Now().Year()
	finishedThisYear := 0
	for _, s := range stat {
		if s.Year == year {
			finishedThisYear = s.Count
			break
		}
	}
	return render(c, "page/home", fiber.Map{
		"counts":             counts,
		"yearRecords":        stat,
		"reading_books":      reading_books,
		"finished_this_year": finishedThisYear,
	})
}
