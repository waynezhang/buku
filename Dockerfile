FROM golang:latest

WORKDIR /app

COPY . .

RUN make build

ENTRYPOINT ["/app/bin/buku"]
