# buku

Self-hosted reading track app for minimalist. Single binary with SQLite database.

<img max-height="320" src="https://github.com/user-attachments/assets/15f3aca7-0156-44e4-830d-1e71f8719548">


<details>
<summary>More Screenshots</summary>

<img max-height="320" src="https://github.com/user-attachments/assets/60415936-d7e1-4870-a919-b1fe245cabca">
<img max-height="320" src="https://github.com/user-attachments/assets/2d4ae526-0d03-478c-9943-fa5aa2859ae3">

</details>

## Features

- Book track
- CSV import
- Simple statistics
- Fill by Google Books
- Responsive

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
- [x] Better URL management
- [ ] Paganation
- [x] Export
- ~[ ] Backup~ Use [Litestream](https://litestream.io)
