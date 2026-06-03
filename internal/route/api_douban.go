package route

import (
	"waynezhang/buku/internal/infra/douban"

	"github.com/gofiber/fiber/v2"
)

func apiDoubanRecommendations(c *fiber.Ctx) error {
	count := c.Query("count", "10")
	books := douban.GetRecommendations(count)
	return c.JSON(books)
}

func apiDoubanRecommendationsByGenre(c *fiber.Ctx) error {
	genre := c.Query("genre", "小说")
	count := c.Query("count", "10")
	books := douban.GetRecommendationsByGenre(genre, count)
	return c.JSON(books)
}