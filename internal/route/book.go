package route

import (
	"slices"
	"time"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/repo/books"
	"waynezhang/buku/internal/route/urls"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func loadPageBookRoutes(f *fiber.App, db *gorm.DB) {
	f.Get(urls.URL_BOOK_NEW_FORM, func(c *fiber.Ctx) error {
		return renderNewBookPage(c, db)
	})

	f.Get(urls.URL_BOOK_ALL_PAGE, func(c *fiber.Ctx) error {
		return renderAllBooksPage(c)
	})
	f.Get(urls.URL_BOOK_SEARCH_REQUEST, func(c *fiber.Ctx) error {
		return handleBooksSearchRequest(c, db)
	})
	f.Get(urls.URL_BOOK_YEAR_PAGE, func(c *fiber.Ctx) error {
		return renderYearlyBookPage(c, db)
	})
	f.Get(urls.URL_BOOK_PAGE, func(c *fiber.Ctx) error {
		return renderBookPage(c, db)
	})
	f.Get(urls.URL_BOOK_EDIT_FORM, func(c *fiber.Ctx) error {
		return renderBookEditPage(c, db)
	})

	f.Post(urls.URL_BOOK_CREATE_REQUEST, func(c *fiber.Ctx) error {
		return handleCreateBookRequest(c, db)
	})
	f.Post(urls.URL_BOOK_UPDATE_REQUEST, func(c *fiber.Ctx) error {
		return handleUpdateBookRequest(c, db)
	})
	f.Post(urls.URL_BOOK_CHANGE_STATUS_REQUEST, func(c *fiber.Ctx) error {
		return handleUpdateBookStatusRequest(c, db)
	})

	f.Delete(urls.URL_BOOK_DELETE_REQUEST, func(c *fiber.Ctx) error {
		return handleDeleteBookRequest(c, db)
	})
}

func renderYearlyBookPage(c *fiber.Ctx, db *gorm.DB) error {
	year := parseYear(c)
	return render(c, "page/year", fiber.Map{
		"year":  year,
		"books": books.GetByYear(db, year),
	})
}

func renderBookPage(c *fiber.Ctx, db *gorm.DB) error {
	return withQueryBook(db, c, func(b *models.Book) error {
		return render(c, "page/book", fiber.Map{"book": b})
	})
}

func renderNewBookPage(c *fiber.Ctx, db *gorm.DB) error {
	return renderBookEditPageWith(c, db, nil, "New Book", nil, nil)
}

func renderBookEditPage(c *fiber.Ctx, db *gorm.DB) error {
	return withQueryBook(db, c, func(b *models.Book) error {
		return renderBookEditPageWith(c, db, &b.ID, b.Title, b, nil)
	})
}

func renderAllBooksPage(c *fiber.Ctx) error {
	return render(c, "page/all_books", nil)
}

func handleBooksSearchRequest(c *fiber.Ctx, db *gorm.DB) error {
	name := c.Query("name", "")
	sort := c.Query("sort", "")
	order := c.Query("order", "")
	status := c.Query("status", "")
	books := books.GetByKeyword(db, name, sort, order, status)
	return render(c, "partials/book_search_results_list", fiber.Map{
		"books": books,
	})
}

func handleCreateBookRequest(c *fiber.Ctx, db *gorm.DB) error {
	book, errs := parseFormAsBook(c)
	if len(errs) > 0 {
		return renderError(c, errs[0])
	}

	created, _ := books.Create(db, book)

	htmxRerenderMain(c, urls.BuildURLBookView(created.ID))
	return render(c, "page/book", fiber.Map{
		"book": created,
	})
}

func handleUpdateBookRequest(c *fiber.Ctx, db *gorm.DB) error {
	return withQueryBook(db, c, func(old *models.Book) error {
		book, errs := parseFormAsBook(c)
		if len(errs) > 0 {
			return renderError(c, errs[0])
		}
		_, err := books.Update(db, old.ID, book)
		if err != nil {
			return renderError(c, err.Error())
		}

		htmxRerenderMain(c, urls.BuildURLBookView(old.ID))
		return renderBookPage(c, db)
	})
}

func handleUpdateBookStatusRequest(c *fiber.Ctx, db *gorm.DB) error {
	return withQueryBook(db, c, func(b *models.Book) error {
		s := c.Params("status")
		statuses := []string{
			models.STATUS_TO_READ,
			models.STATUS_READ,
			models.STATUS_READING,
		}
		if !slices.Contains(statuses, s) {
			return renderError(c, "Invalid status")
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
			return renderError(c, err.Error())
		}

		htmxRerenderMain(c, urls.BuildURLBookView(b.ID))
		return renderBookPage(c, db)
	})
}

func handleDeleteBookRequest(c *fiber.Ctx, db *gorm.DB) error {
	id := parseID(c)
	if id == nil {
		return renderError(c, "ID is invalid")
	}

	_ = books.Delete(db, *id)

	htmxRerenderMain(c, "/page/home")
	return renderHomePage(c, db)
}
