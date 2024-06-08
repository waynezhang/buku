package gbook

import (
	"encoding/json"
	"fmt"
	"net/url"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type Book struct {
	Id     int
	Title  string
	Author string
	ISBN   string
}

type Volume struct {
	Title         string   `json:"title"`
	Authors       []string `json:"authors"`
	PublishedDate string   `json:"publishedDate"`
	PageCount     int      `json:"pageCount"`
	Categories    []string `json:"categories"`
	ImageLinks    struct {
		Thumbnail string `json:"thumbnail"`
	}
	IndustryIdentifiers []struct {
		Type       string `json:"type"`
		Identifier string `json:"identifier"`
	}
	Language string `json:"language"`
}

type item struct {
	Volume Volume `json:"volumeInfo"`
}

type response struct {
	Items []item `json:"items"`
}

func (v *Volume) FirstAuthor() string {
	if len(v.Authors) > 0 {
		return v.Authors[0]
	}
	return ""
}

func (v *Volume) ISBN() string {
	for _, ii := range v.IndustryIdentifiers {
		if ii.Type == "ISBN_13" {
			return ii.Identifier
		}
		if ii.Type == "ISBN_10" {
			return ii.Identifier
		}
	}
	return ""
}

func Search(query string, maxResults string) []Book {
	size, _ := strconv.Atoi(maxResults)
	if size == 0 {
		size = 10
	}
	agent := fiber.AcquireClient().Get("https://www.googleapis.com/books/v1/volumes")
	agent.QueryString(fmt.Sprintf("maxResults=%d&q=%s", size, url.QueryEscape(query)))
	_, body, _ := agent.Bytes()

	results := response{}
	json.Unmarshal(body, &results)

	books := []Book{}
	for i, item := range results.Items {
		books = append(books, Book{
			Id:     i,
			Title:  item.Volume.Title,
			Author: item.Volume.FirstAuthor(),
			ISBN:   item.Volume.ISBN(),
		})
	}

	return books
}
