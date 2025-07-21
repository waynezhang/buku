package route

import (
	"waynezhang/buku/internal/infra/config"

	"github.com/gofiber/fiber/v2"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func apiLogin(c *fiber.Ctx, cfg *config.Config) error {
	req := new(LoginRequest)
	if err := c.BodyParser(req); err != nil {
		return renderJSONError(c, "Invalid request")
	}

	if req.Username != cfg.Username || req.Password != cfg.Password {
		return renderJSONError(c, "Invalid credentials")
	}

	// Create session
	sess, err := store.Get(c)
	if err != nil {
		return renderJSONError(c, "Session error")
	}

	sess.Set("authenticated", true)
	sess.Set("username", req.Username)
	
	if err := sess.Save(); err != nil {
		return renderJSONError(c, "Session save error")
	}

	return c.JSON(fiber.Map{
		"ok":       true,
		"message":  "Login successful",
		"username": req.Username,
	})
}

func apiLogout(c *fiber.Ctx) error {
	sess, err := store.Get(c)
	if err != nil {
		return renderJSONError(c, "Session error")
	}

	if err := sess.Destroy(); err != nil {
		return renderJSONError(c, "Logout error")
	}

	return renderJSONOKMessage(c)
}

func apiCheckAuth(c *fiber.Ctx) error {
	sess, err := store.Get(c)
	if err != nil {
		return c.JSON(fiber.Map{"authenticated": false})
	}

	authenticated := sess.Get("authenticated")
	username := sess.Get("username")

	if authenticated == true {
		return c.JSON(fiber.Map{
			"authenticated": true,
			"username":      username,
		})
	}

	return c.JSON(fiber.Map{"authenticated": false})
}