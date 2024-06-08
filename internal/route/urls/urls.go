package urls

import "fmt"

const (
	URL_HOME    = "/page/home"
	URL_BACKLOG = "/page/backlog"

	URL_BOOK_NEW_FORM                   = "/page/book/new"
	URL_BOOK_ALL_PAGE                   = "/page/book/all"
	URL_BOOK_SEARCH_REQUEST             = "/page/book/search"
	URL_BOOK_SEARCH_FROM_GOOGLE_REQUEST = "/page/book/google_search"
	URL_BOOK_YEAR_PAGE                  = "/page/book/year/:year"
	URL_BOOK_PAGE                       = "/page/book/:id<int>"
	URL_BOOK_EDIT_FORM                  = "/page/book/:id<int>/edit"
	URL_BOOK_CREATE_REQUEST             = "/page/book/"
	URL_BOOK_UPDATE_REQUEST             = "/page/book/:id<int>"
	URL_BOOK_CHANGE_STATUS_REQUEST      = "/page/book/:id<int>/status/:status"
	URL_BOOK_DELETE_REQUEST             = "/page/book/:id<int>"

	URL_AUTHOR_ALL_PAGE       = "/page/author/all"
	URL_AUTHOR_SEARCH_REQUEST = "/page/author/search"
	URL_AUTHOR_PAGE           = "/page/author/:name"
	URL_AUTHOR_RENAME_REQUEST = "/page/author/:name/rename"

	URL_SERIES_ALL_PAGE       = "/page/series/all"
	URL_SERIES_PAGE           = "/page/series/:name"
	URL_SERIES_RENAME_REQUEST = "/page/series/:name/rename"

	URL_ADMIN_PAGE                  = "/page/admin"
	URL_ADMIN_NUKE_DATABASE_REQUEST = "/page/admin/nuke"

	URL_IMPORT_PAGE                  = "/page/import"
	URL_IMPORT_RQUEST                = "/page/import"
	URL_IMPORT_SELECT_COLUMN_REQUEST = "/page/import/select_columns"
)

func BuildURLBookView(id uint) string {
	return fmt.Sprintf("/page/book/%d", id)
}
