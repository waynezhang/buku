package utils

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSortOrder(t *testing.T) {
	assert.Equal(t, SortOrder("asc"), "asc")
	assert.Equal(t, SortOrder("desc"), "desc")
	assert.Equal(t, SortOrder(""), "asc")
	assert.Equal(t, SortOrder("-"), "asc")
}
