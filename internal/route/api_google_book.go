package route

import (
	"waynezhang/buku/internal/infra/config"
	"waynezhang/buku/internal/infra/gbook"

	"github.com/gofiber/fiber/v2"
)

func apiGoogleBookSearch(c *fiber.Ctx, cfg *config.Config) error {
	books := gbook.Search(c.Query("query"), c.Query("max_results"), cfg.GoogleBooksAPIKey)
	return c.JSON(books)
}
