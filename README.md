# mirakc-ui

A Web UI for [mirakc](https://github.com/mirakc/mirakc).

## Features

- Browse TV program listings.
- Recording management.

## Install

First, enable
[mirakc's recording reservation feature](https://mirakc.github.io/dekiru-mirakc/latest/config/recording.html).

Add the following to `docker-compose.yml`.

```yml:docker-compose.yml
services:
  mirakc:
    image: mirakc/mirakc:alpine
    init: true
    restart: unless-stopped
    ports:
      - 40772:40772
    volumes:
      - ./config.yml:/etc/mirakc/config.yml:ro
    environment:
      TZ: Asia/Tokyo
      RUST_LOG: info
## from:
  mirakc-ui:
    image: ghcr.io/ansanloms/mirakc-ui:latest
    ports:
      - 8888:8000
    environment:
      MIRAKC_API_URL: http://mirakc:40772/api
## to:
```

After launching, you will have access to:

- http://localhost:8888/recording
- http://localhost:8888/program
- http://localhost:8888/search
