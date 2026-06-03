package config

import (
	"os"

	"github.com/gofiber/fiber/v2/log"
	"github.com/joho/godotenv"
)

type Config struct {
	DatabasePath      string
	Debug             bool
	ListenPort        string
	Username          string
	Password          string
	AuthDisabled      bool
	GoogleBooksAPIKey string
}

func Load() *Config {
	_ = godotenv.Load(".env")
	
	// Check if auth environment variables are set
	_, usernameSet := os.LookupEnv("BUKU_USERNAME")
	_, passwordSet := os.LookupEnv("BUKU_PASSWORD")
	authDisabled := !usernameSet && !passwordSet
	
	config := Config{
		DatabasePath: getEnv("DB_PATH", "./db.sqlite"),
		Debug:        getEnv("DEBUG", "false") == "true",
		ListenPort:   getEnv("LISTEN_PORT", ":9000"),
		Username:          getEnv("BUKU_USERNAME", "admin"),
		Password:          getEnv("BUKU_PASSWORD", "password"),
		AuthDisabled:      authDisabled,
		GoogleBooksAPIKey: getEnv("GOOGLE_BOOKS_API_KEY", ""),
	}
	log.Debugf("Config: DatabasePath=%s, Debug=%t, ListenPort=%s, Username=%s, AuthDisabled=%t",
		config.DatabasePath, config.Debug, config.ListenPort, config.Username, config.AuthDisabled)

	return &config
}

func getEnv(key string, fallback string) string {
	value, exists := os.LookupEnv(key)
	if !exists {
		value = fallback
	}
	return value
}
