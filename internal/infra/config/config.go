package config

import (
	"os"

	"github.com/gofiber/fiber/v2/log"
	"github.com/joho/godotenv"
)

type Config struct {
	DatabasePath string
	Debug        bool
	ListenPort   string
}

func Load() *Config {
	_ = godotenv.Load(".env")
	config := Config{
		DatabasePath: os.Getenv("DB_PATH"),
		Debug:        os.Getenv("DEBUG") == "true",
		ListenPort:   os.Getenv("LISTEN_PORT"),
	}
	log.Debug("Config %v", config)

	return &config
}
