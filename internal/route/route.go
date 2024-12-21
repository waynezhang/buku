package route

import (
	"fmt"
	"time"
	"waynezhang/buku/internal/infra/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/template/html/v2"
	"gorm.io/gorm"
)

func Load(cfg *config.Config, db *gorm.DB) *fiber.App {
	// engine := pug.New("./views", ".pug")
	engine := html.New("./views", ".html")
	engine.Debug(cfg.Debug)
	engine.Reload(cfg.Debug)
	engine.AddFunc("now", func() string {
		return time.Now().Format("2006-01-02")
	})
	engine.AddFunc("this_year", func() string {
		return fmt.Sprintf("%d", time.Now().Year())
	})
	engine.AddFunc("date_fmt", func(t *time.Time) string {
		if t == nil {
			return ""
		} else {
			return t.Format("2006-01-02")
		}
	})

	f := fiber.New(fiber.Config{
		Views: engine,
	})
	f.Use(logger.New())

	f.Get("/", func(c *fiber.Ctx) error { return c.Redirect("/page/home") })

	f.Static("/", "./static")
	f.Get("/health", func(c *fiber.Ctx) error { return c.SendString("OK") })

	f.Get(API_HOME, func(c *fiber.Ctx) error {
		return apiHome(c, db)
	})

	// books
	f.Get(API_BOOKS, func(c *fiber.Ctx) error {
		return apiBooks(c, db)
	})
	f.Get(API_BOOKS_BY_STATUS, func(c *fiber.Ctx) error {
		return apiBooksByStatus(c, db)
	})
	f.Get(API_BOOKS_BY_YEAR, func(c *fiber.Ctx) error {
		return apiBooksByYear(c, db)
	})
	f.Get(API_BOOKS_BY_AUTHOR, func(c *fiber.Ctx) error {
		return apiBooksByAuthor(c, db)
	})
	f.Get(API_BOOKS_BY_SERIES, func(c *fiber.Ctx) error {
		return apiBooksBySeries(c, db)
	})

	// book
	f.Get(API_BOOK_BY_ID, func(c *fiber.Ctx) error {
		return apiBookById(c, db)
	})
	f.Delete(API_BOOK_BY_ID, func(c *fiber.Ctx) error {
		return apiDeleteBookById(c, db)
	})
	f.Post(API_CREATE_BOOK, func(c *fiber.Ctx) error {
		return apiCreateBook(c, db)
	})
	f.Post(API_UPDATE_BOOK, func(c *fiber.Ctx) error {
		return apiUpdateBook(c, db)
	})
	f.Post(API_BOOK_CHANGE_STATUS, func(c *fiber.Ctx) error {
		return apiBookChangeStatus(c, db)
	})

	// google book
	f.Get(API_GOOGLE_BOOK_SEARCH, func(c *fiber.Ctx) error {
		return apiGoogleBookSearch(c)
	})

	// authors
	f.Get(API_AUTHORS, func(c *fiber.Ctx) error {
		return apiAuthors(c, db)
	})
	f.Post(API_RENAME_AUTHOR, func(c *fiber.Ctx) error {
		return apiRenameAuthor(c, db)
	})

	// series
	f.Get(API_SERIES, func(c *fiber.Ctx) error {
		return apiSeries(c, db)
	})
	f.Post(API_RENAME_SERIES, func(c *fiber.Ctx) error {
		return apiRenameSeries(c, db)
	})

	// admin
	f.Post(API_DELETE_ALL, func(c *fiber.Ctx) error {
		return apiDeleteAll(c, db)
	})

	// import
	f.Post(API_ADMIN_IMPORT_READ_COLUMNS, func(c *fiber.Ctx) error {
		return apiImportReadColumns(c)
	})
	f.Post(API_ADMIN_IMPORT, func(c *fiber.Ctx) error {
		return apiImport(c, db)
	})

	// export
	f.Get(API_ADMIN_EXPORT, func(c *fiber.Ctx) error {
		return handleCSVExportRequest(c, db)
	})

	// fallback
	f.Group("/page", func(c *fiber.Ctx) error {
		return render(c, "page/index", fiber.Map{})
	})
	f.Static("/components", "./views/components")

	return f
}
