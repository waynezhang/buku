package models

import (
	"strings"
	"time"
)

const (
	STATUS_READING = "reading"
	STATUS_TO_READ = "to-read"
	STATUS_READ    = "read"
)

type Book struct {
	ID         uint
	Title      string
	Author     string
	Series     string
	ISBN       string
	Comments   string
	Status     string     `gorm:"default:to-read"`
	StartedAt  *time.Time `gorm:"type:date"`
	FinishedAt *time.Time `gorm:"type:date"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

func (b *Book) Validate() []string {
	errors := []string{}

	if len(strings.TrimSpace(b.Title)) == 0 {
		errors = append(errors, "Title is required")
	}
	if b.StartedAt != nil && b.FinishedAt != nil && b.StartedAt.After(*b.FinishedAt) {
		errors = append(errors, "Date format is invalid")
	}

	return errors
}

func (b *Book) FixStatus() {
	if b.StartedAt == nil && b.FinishedAt == nil {
		b.Status = STATUS_TO_READ
	} else if b.StartedAt != nil && b.FinishedAt == nil {
		b.Status = STATUS_READING
	} else if b.StartedAt == nil && b.FinishedAt != nil {
		b.StartedAt = b.FinishedAt
		b.Status = STATUS_READ
	} else if b.StartedAt != nil && b.FinishedAt != nil {
		b.Status = STATUS_READ
	}
}
