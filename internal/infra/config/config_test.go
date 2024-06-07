package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad(t *testing.T) {
	os.Setenv("DB_PATH", "/db-path")
	os.Setenv("DEBUG", "true")
	os.Setenv("LISTEN_PORT", ":9999")

	c := Load()
	assert.Equal(t, c.DatabasePath, "/db-path")
	assert.Equal(t, c.Debug, true)
	assert.Equal(t, c.ListenPort, ":9999")
}
