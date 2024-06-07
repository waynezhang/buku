package route

import (
	"waynezhang/buku/internal/infra/database"
	"waynezhang/buku/internal/route/urls"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func loadPageAdminRoutes(f *fiber.App, db *gorm.DB) {
	f.Get(urls.URL_ADMIN_PAGE, func(c *fiber.Ctx) error {
		return render(c, "page/admin", fiber.Map{})
	})
	f.Post(urls.URL_ADMIN_NUKE_DATABASE_REQUEST, func(c *fiber.Ctx) error {
		return handleDatabaseNukeRequest(c, db)
	})
}

func handleDatabaseNukeRequest(c *fiber.Ctx, db *gorm.DB) error {
	database.Nuke(db)
	return renderMessage(c, "Succeeded")
}
