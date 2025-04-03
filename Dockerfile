# Build
FROM golang:latest as build

WORKDIR /go/src/app

COPY . .
RUN make build

# Run
FROM gcr.io/distroless/base
WORKDIR /app

COPY --from=build /go/src/app/bin/buku /app
COPY static ./static
COPY views ./views

ENTRYPOINT ["/app/buku"]
