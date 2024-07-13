package route

import (
	"waynezhang/buku/internal/infra/gbook"

	"github.com/gofiber/fiber/v2"
)

func apiGoogleBookSearch(c *fiber.Ctx) error {
	books := gbook.Search(c.Query("query"), c.Query("max_results"))
	return c.JSON(books)
}
