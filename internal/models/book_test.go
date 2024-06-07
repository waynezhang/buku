package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestValidate(t *testing.T) {
	errs := []string{}

	b := Book{}

	errs = b.Validate()
	assert.Len(t, errs, 1)
	assert.Equal(t, errs[0], "Title is required")

	t1 := time.Now()
	b.StartedAt = &t1
	t2 := t1.Add(-1)
	b.FinishedAt = &t2
	errs = b.Validate()
	assert.Len(t, errs, 2)
	assert.Equal(t, errs[1], "Date format is invalid")

	b.Title = "a"
	errs = b.Validate()
	assert.Len(t, errs, 1)
	assert.Equal(t, errs[0], "Date format is invalid")

	b.FinishedAt = b.StartedAt
	errs = b.Validate()
	assert.Len(t, errs, 0)
}

func TestFixStatus(t *testing.T) {
	now := time.Now()

	b := Book{}

	b.FixStatus()
	assert.Nil(t, b.StartedAt)
	assert.Nil(t, b.FinishedAt)
	assert.Equal(t, b.Status, STATUS_TO_READ)

	b.Status = ""
	b.StartedAt = &now
	b.FixStatus()
	assert.NotNil(t, b.StartedAt)
	assert.Nil(t, b.FinishedAt)
	assert.Equal(t, b.Status, STATUS_READING)

	b.Status = ""
	b.StartedAt = &now
	b.FinishedAt = &now
	b.FixStatus()
	assert.NotNil(t, b.StartedAt)
	assert.NotNil(t, b.FinishedAt)
	assert.Equal(t, b.Status, STATUS_READ)

	b.Status = ""
	b.StartedAt = nil
	b.FinishedAt = &now
	b.FixStatus()
	assert.NotNil(t, b.StartedAt)
	assert.NotNil(t, b.FinishedAt)
	assert.Equal(t, b.Status, STATUS_READ)
}
