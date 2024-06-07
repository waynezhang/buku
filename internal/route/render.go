package route

import (
	hg "github.com/angelofallars/htmx-go"
	"github.com/gofiber/fiber/v2"
)

func renderError(c *fiber.Ctx, message string) error {
	return render(c, "partials/error_message", fiber.Map{
		"error_message": message,
	})
}

func renderMessage(c *fiber.Ctx, message string) error {
	return render(c, "partials/message", fiber.Map{
		"message": message,
	})
}

func render(c *fiber.Ctx, tpl string, data interface{}) error {
	if len(c.GetReqHeaders()[hg.HeaderRequest]) > 0 {
		return c.Render(tpl, data)
	} else {
		return c.Render(tpl, data, "layouts/main")
	}
}

func htmxRerenderMain(c *fiber.Ctx, url string) {
	c.Response().Header.Add(hg.HeaderReplaceUrl, url)
	c.Response().Header.Add(hg.HeaderRetarget, "main")
}
