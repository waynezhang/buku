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
		DatabasePath: getEnv("DB_PATH", "./db.sqlite"),
		Debug:        getEnv("DEBUG", "false") == "true",
		ListenPort:   getEnv("LISTEN_PORT", ":9000"),
	}
	log.Debug("Config ", config)

	return &config
}

func getEnv(key string, fallback string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		value = fallback
	}
	return value
}
