package route

import (
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/repo/authors"
	"waynezhang/buku/internal/repo/books"
	"waynezhang/buku/internal/repo/series"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func renderBookListPage(c *fiber.Ctx, db *gorm.DB, title string, status books.ReadStatus) error {
	return render(c, "page/book_list", fiber.Map{
		"title": title,
		"books": books.GetByStatus(db, status),
	})
}

func renderBookEditPageWith(c *fiber.Ctx, db *gorm.DB, bookID *uint, title string, book *models.Book, errs []string) error {
	m := fiber.Map{
		"title":   title,
		"authors": authors.GetAll(db, "", ""),
		"series":  series.GetAll(db),
	}
	if bookID != nil {
		m["bookID"] = *bookID
	}
	if book != nil {
		m["book"] = book
	}
	if len(errs) > 0 {
		m["error_messages"] = errs
	}
	return render(c, "page/book_edit", m)
}
