package route

import (
	"time"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/repo/books"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func apiHome(c *fiber.Ctx, db *gorm.DB) error {
	year := time.Now().Year()
	stat := books.CountStatInYears(db)

	this_year := books.YearRecord{Year: year}
	for _, s := range stat {
		if s.Year == year {
			this_year = s
			break
		}
	}

	return c.JSON(fiber.Map{
		"year_records":        stat,
		"current_year_record": this_year,
		"reading_books":       books.GetByStatus(db, models.STATUS_READING),
		"counts":              books.CountAll(db),
	})
}
