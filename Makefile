OUTPUT_PATH=bin
BINARY=buku
LDFLAGS=-ldflags "-s -w"

all: build

build:
	@go build ${LDFLAGS} -o ${OUTPUT_PATH}/${BINARY} main.go

test:
	@go test ./...

coverage:
	@TMPFILE=$$(mktemp); \
		go test ./... -coverprofile=$$TMPFILE; \
		go tool cover -html $$TMPFILE

.PHONY: install
install:
	@go install ${LDFLAGS} ./...

.PHONY: clean
clean:
	@if [ -f ${OUTPUT_PATH}/${BINARY} ] ; then rm ${OUTPUT_PATH}/${BINARY} ; fi
