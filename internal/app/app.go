package app

import (
	"waynezhang/buku/internal/infra/config"
	"waynezhang/buku/internal/infra/database"
	"waynezhang/buku/internal/route"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/log"
	"gorm.io/gorm"
)

type App struct {
	config *config.Config
	db     *gorm.DB
	f      *fiber.App
}

func New() *App {
	app := App{}
	app.config = config.Load()

	db, err := database.Load(app.config.DatabasePath)
	if err != nil {
		log.Fatal("Failed to load database (%s).", err.Error())
	}
	app.db = db
	if app.config.Debug {
		app.db = db.Debug()
	}

	app.f = route.Load(app.config, app.db)

	return &app
}

func (app *App) Start() {
	_ = app.f.Listen(app.config.ListenPort)
}
