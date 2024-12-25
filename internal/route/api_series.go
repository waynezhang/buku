package route

import (
	"net/url"
	"waynezhang/buku/internal/repo"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func apiSeries(c *fiber.Ctx, db *gorm.DB) error {
	name := c.Query("name")
	order := c.Query("order")
	series := repo.GetAll(db, "series", name, order)
	return c.JSON(series)
}

func apiRenameSeries(c *fiber.Ctx, db *gorm.DB) error {
	type renameSeriesRequest struct {
		Name string `json:"name"`
	}

	r := new(renameSeriesRequest)
	if err := c.BodyParser(&r); err != nil {
		return renderJSONError(c, err.Error())
	}

	oldName, _ := url.QueryUnescape(c.Params("name"))

	if err := repo.Rename(db, "series", oldName, r.Name); err != nil {
		return renderJSONError(c, err.Error())
	}

	return renderJSONOKMessage(c)
}
