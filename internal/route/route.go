package route

import (
	"time"
	"waynezhang/buku/internal/infra/config"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/route/urls"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/template/pug/v2"
	"gorm.io/gorm"
)

func Load(cfg *config.Config, db *gorm.DB) *fiber.App {
	engine := pug.New("./views", ".pug")
	engine.Debug(cfg.Debug)
	engine.Reload(cfg.Debug)
	engine.AddFunc("now", func() string {
		return time.Now().Format("2006-01-02")
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

	f.Get(urls.URL_HOME, func(c *fiber.Ctx) error {
		return renderHomePage(c, db)
	})
	f.Get(urls.URL_BACKLOG, func(c *fiber.Ctx) error {
		return renderBookListPage(c, db, "Backlog", models.STATUS_TO_READ)
	})

	loadPageBookRoutes(f, db)
	loadPageAuthorRoutes(f, db)
	loadPageSeriesRoutes(f, db)
	loadPageAdminRoutes(f, db)
	loadPageImportRoutes(f, db)

	return f
}
