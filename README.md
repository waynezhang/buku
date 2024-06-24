# buku

Self-hosted reading track app for minimalist. Single binary with SQLite database.

<img width="400" src="https://github.com/waynezhang/buku/assets/480052/14b7d064-8185-42eb-bc49-8576d4177519">
<img width="400" src="https://github.com/waynezhang/buku/assets/480052/b31e42db-0a22-430d-a69c-55e2dfb99fe8">

## Features

- Book track
- CSV import
- Simple statistics
- Fill by Google Books

## Build

`make build`

## Run from Docker

```yaml
services:
  buku:
    image: ghcr.io/waynezhang/buku:main
    container_name: buku
    ports:
      - 9000:9000
    volumes:
      - ./db:/db
    environment:
      - DB_PATH
      - DEBUG
      - LISTEN_PORT
```

## Configure

Create `.env` (sample: `env.sample`) and fill the values.

```
DB_PATH=/db/db.sqlite
DEBUG=false
LISTEN_PORT=:9000
```

## TODO

- [x] Google Books Integration
- [ ] Better navigation
- [ ] Better URL management
- [ ] Paganation
- [x] Export
- ~[ ] Backup~ Use [Litestream](https://litestream.io)
