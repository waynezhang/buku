package route

import (
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/repo/books"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func renderHomePage(c *fiber.Ctx, db *gorm.DB) error {
	counts := books.CountAll(db)
	stat := books.CountStatInYears(db)
	reading_books := books.GetByStatus(db, models.STATUS_READING)
	return render(c, "page/home", fiber.Map{
		"counts":        counts,
		"yearRecords":   stat,
		"reading_books": reading_books,
	})
}
