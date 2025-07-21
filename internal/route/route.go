package route

import (
	"waynezhang/buku/internal/infra/config"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/session"
	"gorm.io/gorm"
)

var store *session.Store

// Authentication middleware
func requireAuth(c *fiber.Ctx) error {
	sess, err := store.Get(c)
	if err != nil {
		return c.Status(401).JSON(fiber.Map{"ok": false, "message": "Authentication required"})
	}

	authenticated := sess.Get("authenticated")
	if authenticated != true {
		return c.Status(401).JSON(fiber.Map{"ok": false, "message": "Authentication required"})
	}

	return c.Next()
}

func Load(cfg *config.Config, db *gorm.DB) *fiber.App {
	f := fiber.New()
	f.Use(logger.New())

	// Initialize session store
	store = session.New()

	f.Get("/", func(c *fiber.Ctx) error { return c.Redirect("/page/login") })

	f.Static("/", "./static")
	f.Get("/health", func(c *fiber.Ctx) error { return c.SendString("OK") })

	// Authentication routes (unprotected)
	f.Post("/api/login", func(c *fiber.Ctx) error {
		return apiLogin(c, cfg)
	})
	f.Post("/api/logout", func(c *fiber.Ctx) error {
		return apiLogout(c)
	})
	f.Get("/api/auth/check", func(c *fiber.Ctx) error {
		return apiCheckAuth(c)
	})

	// Protected API routes
	api := f.Group("/api", requireAuth)

	api.Get("/home.json", func(c *fiber.Ctx) error {
		return apiHome(c, db)
	})

	// books
	api.Get("/books.json", func(c *fiber.Ctx) error {
		return apiBooks(c, db)
	})
	api.Get("/books/:status.json", func(c *fiber.Ctx) error {
		return apiBooksByStatus(c, db)
	})
	api.Get("/books/year/:year<int>.json", func(c *fiber.Ctx) error {
		return apiBooksByYear(c, db)
	})
	api.Get("/books/author/:name.json", func(c *fiber.Ctx) error {
		return apiBooksByAuthor(c, db)
	})
	api.Get("/books/series/:name.json", func(c *fiber.Ctx) error {
		return apiBooksBySeries(c, db)
	})

	// book
	api.Get("/book/:id<int>.json", func(c *fiber.Ctx) error {
		return apiBookById(c, db)
	})
	api.Delete("/book/:id<int>.json", func(c *fiber.Ctx) error {
		return apiDeleteBookById(c, db)
	})
	api.Post("/book.json", func(c *fiber.Ctx) error {
		return apiCreateBook(c, db)
	})
	api.Post("/book/:id<int>.json", func(c *fiber.Ctx) error {
		return apiUpdateBook(c, db)
	})
	api.Post("/book/:id<int>/status.json", func(c *fiber.Ctx) error {
		return apiBookChangeStatus(c, db)
	})

	// google book
	api.Get("/google_book_search.json", func(c *fiber.Ctx) error {
		return apiGoogleBookSearch(c)
	})

	// authors
	api.Get("/authors.json", func(c *fiber.Ctx) error {
		return apiAuthors(c, db)
	})
	api.Post("/author/:name.json", func(c *fiber.Ctx) error {
		return apiRenameAuthor(c, db)
	})

	// series
	api.Get("/series.json", func(c *fiber.Ctx) error {
		return apiSeries(c, db)
	})
	api.Post("/series/:name.json", func(c *fiber.Ctx) error {
		return apiRenameSeries(c, db)
	})

	// admin
	api.Post("/delete_all.json", func(c *fiber.Ctx) error {
		return apiDeleteAll(c, db)
	})

	// import
	api.Post("/import/read_columns", func(c *fiber.Ctx) error {
		return apiImportReadColumns(c)
	})
	api.Post("/import", func(c *fiber.Ctx) error {
		return apiImport(c, db)
	})

	// export
	api.Get("/export", func(c *fiber.Ctx) error {
		return handleCSVExportRequest(c, db)
	})

	// SPA fallback - serve index.html for all /page routes
	f.Get("/page/*", func(c *fiber.Ctx) error {
		return c.SendFile("./static/index.html")
	})

	return f
}
