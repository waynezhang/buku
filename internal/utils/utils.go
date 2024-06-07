package utils

import "slices"

func SortOrder(str string) string {
	if slices.Index([]string{"asc", "desc"}, str) < 0 {
		return "asc"
	}
	return str
}
