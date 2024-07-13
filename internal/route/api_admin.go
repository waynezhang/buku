package route

import (
	"waynezhang/buku/internal/infra/database"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// admin

func apiDeleteAll(c *fiber.Ctx, db *gorm.DB) error {
	database.Nuke(db)
	return renderJSONOKMessage(c)
}
