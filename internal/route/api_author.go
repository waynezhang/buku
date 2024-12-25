package route

import (
	"net/url"
	"waynezhang/buku/internal/repo"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func apiAuthors(c *fiber.Ctx, db *gorm.DB) error {
	name := c.Query("name")
	order := c.Query("order")
	authors := repo.GetAll(db, "author", name, order)
	return c.JSON(authors)
}

func apiRenameAuthor(c *fiber.Ctx, db *gorm.DB) error {
	type renameAuthorRequest struct {
		Name string `json:"name"`
	}

	r := new(renameAuthorRequest)
	if err := c.BodyParser(&r); err != nil {
		return renderJSONError(c, err.Error())
	}

	oldName, _ := url.QueryUnescape(c.Params("name"))

	if err := repo.Rename(db, "author", oldName, r.Name); err != nil {
		return renderJSONError(c, err.Error())
	}

	return renderJSONOKMessage(c)
}
