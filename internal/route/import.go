package route

import (
	"encoding/csv"
	"slices"
	"time"
	"waynezhang/buku/internal/models"
	"waynezhang/buku/internal/repo/books"
	"waynezhang/buku/internal/route/urls"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func loadPageImportRoutes(f *fiber.App, db *gorm.DB) {
	f.Get(urls.URL_IMPORT_PAGE, func(c *fiber.Ctx) error {
		return render(c, "page/import", fiber.Map{})
	})
	f.Post(urls.URL_IMPORT_RQUEST, func(c *fiber.Ctx) error {
		return handleCSVImportRequest(c, db)
	})
	f.Post(urls.URL_IMPORT_SELECT_COLUMN_REQUEST, func(c *fiber.Ctx) error {
		return handleCSVImportSelectColumnsRequest(c)
	})
}

func handleCSVImportSelectColumnsRequest(c *fiber.Ctx) error {
	err := withCSVFileReader(c, func(r csv.Reader) error {
		columns, err := r.Read()
		if err != nil {
			return err
		}
		return render(c, "partials/import_column_options", fiber.Map{
			"presets": []string{
				"Title",
				"Author",
				"Series",
				"ISBN",
				"Comments",
				"Started",
				"Finished",
			},
			"columns": append([]string{"-"}, columns...)},
		)
	})
	if err != nil {
		return renderError(c, err.Error())
	}
	return nil
}

func handleCSVImportRequest(c *fiber.Ctx, db *gorm.DB) error {
	findColumnIdx := func(c *fiber.Ctx, name string, columns []string) int {
		colName := c.FormValue(name)
		return slices.Index(columns, colName)
	}
	getStrVal := func(idx int, record []string) string {
		if idx < 0 || idx >= len(record) {
			return ""
		}
		return record[idx]
	}
	getTimeVal := func(idx int, record []string) *time.Time {
		if idx < 0 || idx >= len(record) {
			return nil
		}
		str := record[idx]
		t, err := time.Parse(time.RFC3339, str)
		if err == nil {
			return &t
		}
		t, err = time.Parse("2006-01-02", str)
		if err == nil {
			return &t
		}
		return nil
	}
	err := withCSVFileReader(c, func(r csv.Reader) error {
		columns, err := r.Read()
		if err != nil {
			return err
		}
		records, err := r.ReadAll()
		if err != nil {
			return err
		}
		titleIdx := findColumnIdx(c, "Title", columns)
		authorIdx := findColumnIdx(c, "Author", columns)
		seriesIdx := findColumnIdx(c, "Series", columns)
		isbnIdx := findColumnIdx(c, "ISBN", columns)
		commentsIdx := findColumnIdx(c, "Comments", columns)
		startedIdx := findColumnIdx(c, "Started", columns)
		finishedIdx := findColumnIdx(c, "Finished", columns)

		succeed := 0
		failed := 0
		total := 0
		for _, rec := range records {
			b := models.Book{}
			b.Title = getStrVal(titleIdx, rec)
			b.Author = getStrVal(authorIdx, rec)
			b.Series = getStrVal(seriesIdx, rec)
			b.ISBN = getStrVal(isbnIdx, rec)
			b.Comments = getStrVal(commentsIdx, rec)
			b.StartedAt = getTimeVal(startedIdx, rec)
			b.FinishedAt = getTimeVal(finishedIdx, rec)
			errs := b.Validate()
			if len(errs) == 0 {
				succeed += 1
			} else {
				failed += 1
			}
			total += 1
			_, _ = books.Create(db, &b)
		}
		return render(c, "partials/import_result", fiber.Map{
			"total":   total,
			"succeed": succeed,
			"failed":  failed,
		})
	})
	if err != nil {
		return renderError(c, err.Error())
	}
	return nil
}

func withCSVFileReader(c *fiber.Ctx, fn func(csv.Reader) error) error {
	files, err := c.FormFile("file")
	if err != nil {
		return err
	}

	f, err := files.Open()
	if err != nil {
		return err
	}
	defer f.Close()

	reader := csv.NewReader(f)
	reader.Comma = []rune(c.FormValue("delimiter", ","))[0]
	reader.FieldsPerRecord = -1
	reader.LazyQuotes = true

	return fn(*reader)
}
