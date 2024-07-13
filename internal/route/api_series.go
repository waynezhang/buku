package route

import (
	"net/url"
	"waynezhang/buku/internal/repo/series"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func apiSeries(c *fiber.Ctx, db *gorm.DB) error {
	return c.JSON(series.GetAll(db))
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

	if err := series.Rename(db, oldName, r.Name); err != nil {
		return renderJSONError(c, err.Error())
	}

	return renderJSONOKMessage(c)
}
