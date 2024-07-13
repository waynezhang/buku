package route

import (
	"github.com/gofiber/fiber/v2"
)

type genericResponse struct {
	Message string `json:"message"`
}

func renderJSONOKMessage(c *fiber.Ctx) error {
	return c.JSON(genericResponse{"OK"})
}

func renderJSONError(c *fiber.Ctx, message string) error {
	return c.Status(fiber.ErrBadGateway.Code).JSON(genericResponse{message})
}

func render(c *fiber.Ctx, tpl string, data interface{}) error {
	return c.Render(tpl, data, "layouts/main")
}
