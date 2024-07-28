# buku

Self-hosted reading track app for minimalist. Single binary with SQLite database.

| Desktop | iPhone |
| --- | --- |
| <img max-height="500" src="https://github.com/user-attachments/assets/4e9f8ca9-6359-49cf-bfcd-8d694b1cecc2"> | <img max-height="500" src="https://github.com/user-attachments/assets/49576670-6f06-4abe-9da2-c031740cc638"> |

<details>
<summary>More Screenshots</summary>

| Desktop | iPhone |
| --- | --- |
| <img max-height="500" src="https://github.com/user-attachments/assets/5bd417eb-c736-47dd-8425-d567f8a01ed1"> | <img max-height="500" src="https://github.com/user-attachments/assets/86705b66-8264-47ad-8285-4184e1432ecc"> |
| <img max-height="500" src="https://github.com/user-attachments/assets/c50bc7df-5cd8-4278-b775-0265fd15ff14"> | <img max-height="500" src="https://github.com/user-attachments/assets/494cc833-89de-4ff2-adb8-a1a04c458962"> |

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
