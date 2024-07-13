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
	ID         uint       `json:"id"`
	Title      string     `json:"title"`
	Author     string     `json:"author"`
	Series     string     `json:"series"`
	ISBN       string     `json:"isbn"`
	Comments   string     `json:"comments"`
	Status     string     `json:"status" gorm:"default:to-read"`
	StartedAt  *time.Time `json:"started_at" gorm:"type:date"`
	FinishedAt *time.Time `json:"finished_at" gorm:"type:date"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
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
