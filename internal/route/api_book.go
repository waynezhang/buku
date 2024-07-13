package route

import (
	"net/url"
	"slices"
	"time"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/repo/books"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func apiBooks(c *fiber.Ctx, db *gorm.DB) error {
	name := c.Query("name")
	order := c.Query("order")
	sort := c.Query("sort", "")
	status := c.Query("status", "")
	books := books.GetByKeyword(db, name, sort, order, status)
	return c.JSON(books)
}

func apiBooksByStatus(c *fiber.Ctx, db *gorm.DB) error {
	b := books.GetByStatus(db, books.ReadStatus(c.Params("status")))
	return c.JSON(b)
}

func apiBooksByYear(c *fiber.Ctx, db *gorm.DB) error {
	year := parseYear(c)
	return c.JSON(books.GetByYear(db, year))
}

func apiBooksByAuthor(c *fiber.Ctx, db *gorm.DB) error {
	name, _ := url.QueryUnescape(c.Params("name"))
	books := books.GetByAuthor(db, name)
	return c.JSON(books)
}

func apiBooksBySeries(c *fiber.Ctx, db *gorm.DB) error {
	name, _ := url.QueryUnescape(c.Params("name"))
	books := books.GetBySeries(db, name, "finished_at", "asc")
	return c.JSON(books)
}

// book
func apiBookById(c *fiber.Ctx, db *gorm.DB) error {
	return withQueryBook(db, c, func(b *models.Book) error {
		return c.JSON(b)
	})
}
func apiCreateBook(c *fiber.Ctx, db *gorm.DB) error {
	book, errs := parseBodyAsBook(c)
	if len(errs) > 0 {
		return renderJSONError(c, errs[0])
	}

	created, _ := books.Create(db, book)

	return c.JSON(created)
}

func apiUpdateBook(c *fiber.Ctx, db *gorm.DB) error {
	return withQueryBook(db, c, func(old *models.Book) error {
		book, errs := parseBodyAsBook(c)
		if len(errs) > 0 {
			return renderJSONError(c, errs[0])
		}
		updated, err := books.Update(db, old.ID, book)
		if err != nil {
			return renderJSONError(c, err.Error())
		}

		return c.JSON(updated)
	})
}

func apiDeleteBookById(c *fiber.Ctx, db *gorm.DB) error {
	id := parseID(c)
	if id == nil {
		return renderJSONError(c, "ID is invalid")
	}

	_ = books.Delete(db, *id)

	return renderJSONOKMessage(c)
}

func apiBookChangeStatus(c *fiber.Ctx, db *gorm.DB) error {
	type bookChangeStatusRequest struct {
		Status string `json:"status"`
	}

	return withQueryBook(db, c, func(b *models.Book) error {
		r := bookChangeStatusRequest{}
		_ = c.BodyParser(&r)
		s := r.Status
		statuses := []string{
			models.STATUS_TO_READ,
			models.STATUS_READ,
			models.STATUS_READING,
		}
		if !slices.Contains(statuses, s) {
			return renderJSONError(c, "Invalid status")
		}

		t := time.Now()
		switch s {
		case models.STATUS_TO_READ:
			b.StartedAt = nil
			b.FinishedAt = nil
		case models.STATUS_READ:
			b.FinishedAt = &t
		case models.STATUS_READING:
			b.StartedAt = &t
			b.FinishedAt = nil
		}
		_, err := books.Update(db, b.ID, b)
		if err != nil {
			return renderJSONError(c, err.Error())
		}

		return renderJSONOKMessage(c)
	})
}

func withQueryBook(db *gorm.DB, c *fiber.Ctx, fn func(*models.Book) error) error {
	id := parseID(c)
	if id == nil {
		return renderJSONError(c, "Book is not found")
	}

	book := books.GetByID(db, *id)
	if book != nil {
		return fn(book)
	} else {
		return renderJSONError(c, "Book is not found")
	}
}
