package route

import (
	"net/url"
	"strings"
	"waynezhang/buku/internal/repo/books"
	"waynezhang/buku/internal/repo/series"
	"waynezhang/buku/internal/route/urls"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func loadPageSeriesRoutes(f *fiber.App, db *gorm.DB) {
	f.Get(urls.URL_SERIES_ALL_PAGE, func(c *fiber.Ctx) error {
		return renderAllSeriesPage(c, db)
	})
	f.Get(urls.URL_SERIES_PAGE, func(c *fiber.Ctx) error {
		return renderSeriesPage(c, db)
	})
	f.Post(urls.URL_SERIES_RENAME_REQUEST, func(c *fiber.Ctx) error {
		return handleSeriesRenameRequest(c, db)
	})
}

func renderAllSeriesPage(c *fiber.Ctx, db *gorm.DB) error {
	return render(c, "page/all_series", fiber.Map{
		"series": series.GetAll(db),
	})
}

func renderSeriesPage(c *fiber.Ctx, db *gorm.DB) error {
	name, _ := url.QueryUnescape(c.Params("name"))
	return renderSeriesPageWith(c, db, name)
}

func handleSeriesRenameRequest(c *fiber.Ctx, db *gorm.DB) error {
	name, _ := url.QueryUnescape(c.Params("name"))
	prompts := c.GetReqHeaders()["Hx-Prompt"]
	if len(prompts) == 0 {
		return renderError(c, "Name cannot be empty")
	}
	newName, _ := url.QueryUnescape(strings.TrimSpace(prompts[0]))
	if len(newName) == 0 {
		return renderError(c, "Name cannot be empty")
	}
	series.Rename(db, name, newName)

	htmxRerenderMain(c, "/page/series/"+url.QueryEscape(newName))
	return renderSeriesPageWith(c, db, newName)
}

func renderSeriesPageWith(c *fiber.Ctx, db *gorm.DB, name string) error {
	books := books.GetBySeries(db, name, "finished_at", "asc")
	return render(c, "page/series", fiber.Map{
		"name":  name,
		"books": books,
	})
}
