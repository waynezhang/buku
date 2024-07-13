package route

const (
	API_HOME                      = "/api/home.json"
	API_BOOKS                     = "/api/books.json"
	API_BOOK_BY_ID                = "/api/book/:id<int>.json"
	API_CREATE_BOOK               = "/api/book.json"
	API_UPDATE_BOOK               = "/api/book/:id<int>.json"
	API_BOOK_CHANGE_STATUS        = "/api/book/:id<int>/status.json"
	API_BOOKS_BY_STATUS           = "/api/books/:status.json"
	API_BOOKS_BY_YEAR             = "/api/books/year/:year<int>.json"
	API_BOOKS_BY_AUTHOR           = "/api/books/author/:name.json"
	API_BOOKS_BY_SERIES           = "/api/books/series/:name.json"
	API_GOOGLE_BOOK_SEARCH        = "/api/google_book_search.json"
	API_AUTHORS                   = "/api/authors.json"
	API_RENAME_AUTHOR             = "/api/author/:name.json"
	API_SERIES                    = "/api/series.json"
	API_RENAME_SERIES             = "/api/series/:name.json"
	API_ADMIN_IMPORT_READ_COLUMNS = "/api/import/read_columns"
	API_ADMIN_IMPORT              = "/api/import"
	API_ADMIN_EXPORT              = "/api/export"
	API_DELETE_ALL                = "/api/delete_all.json"
)
