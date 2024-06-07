package route

import (
	"net/url"
	"strings"
	"waynezhang/buku/internal/repo/authors"
	"waynezhang/buku/internal/repo/books"
	"waynezhang/buku/internal/route/urls"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func loadPageAuthorRoutes(f *fiber.App, db *gorm.DB) {
	f.Get(urls.URL_AUTHOR_ALL_PAGE, func(c *fiber.Ctx) error {
		return renderAllAuthorsPage(c)
	})
	f.Get(urls.URL_AUTHOR_SEARCH_REQUEST, func(c *fiber.Ctx) error {
		return handleAuthorsSearchRequest(c, db)
	})
	f.Get(urls.URL_AUTHOR_PAGE, func(c *fiber.Ctx) error {
		return renderAuthorPage(c, db)
	})
	f.Post(urls.URL_AUTHOR_RENAME_REQUEST, func(c *fiber.Ctx) error {
		return handleAuthorRenameRequest(c, db)
	})
}

func renderAllAuthorsPage(c *fiber.Ctx) error {
	return render(c, "page/all_authors", fiber.Map{})
}

func renderAuthorPage(c *fiber.Ctx, db *gorm.DB) error {
	name, _ := url.QueryUnescape(c.Params("name"))
	return renderAuthorPageWith(c, db, name)
}

func handleAuthorsSearchRequest(c *fiber.Ctx, db *gorm.DB) error {
	name := c.Query("name")
	order := c.Query("order")
	authors := authors.GetAll(db, name, order)
	return render(c, "partials/author_search_results_list", fiber.Map{
		"authors": authors,
	})
}

func handleAuthorRenameRequest(c *fiber.Ctx, db *gorm.DB) error {
	name, _ := url.QueryUnescape(c.Params("name"))
	prompts := c.GetReqHeaders()["Hx-Prompt"]
	if len(prompts) == 0 {
		return renderError(c, "Name cannot be empty")
	}
	newName, _ := url.QueryUnescape(strings.TrimSpace(prompts[0]))
	if len(newName) == 0 {
		return renderError(c, "Name cannot be empty")
	}
	authors.Rename(db, name, newName)

	htmxRerenderMain(c, "/page/author/"+url.QueryEscape(newName))
	return renderAuthorPageWith(c, db, newName)
}

func renderAuthorPageWith(c *fiber.Ctx, db *gorm.DB, name string) error {
	books := books.GetByAuthor(db, name)
	return render(c, "page/author", fiber.Map{
		"name":  name,
		"books": books,
	})
}
