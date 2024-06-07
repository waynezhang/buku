package urls

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestBuildURLBookView(t *testing.T) {
	assert.Equal(t, BuildURLBookView(111), "/page/book/111")
}
