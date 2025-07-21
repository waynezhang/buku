package route

import (
	"github.com/gofiber/fiber/v2"
)

func renderJSONOKMessage(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"ok":      true,
		"message": "OK",
	})
}

func renderJSONError(c *fiber.Ctx, message string) error {
	return c.JSON(fiber.Map{
		"ok":      false,
		"message": message,
	})
}