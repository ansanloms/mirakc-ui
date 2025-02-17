# mirakc-ui

A Web UI for [mirakc](https://github.com/mirakc/mirakc).

## Features

- Browse TV program listings.
- Recording management.

### Install

First, enable
[mirakc's recording reservation feature](https://mirakc.github.io/dekiru-mirakc/latest/config/recording.html).

Add the following to `docker-compose.yml`.

```yml:docker-compose.yml
services:
  mirakc:
    image: mirakc/mirakc:alpine
    container_name: mirakc
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
    build:
      context: ./mirakc-ui
      dockerfile: Dockerfile
    container_name: mirakc-ui
    ports:
      - 8888:8000
    environment:
      MIRAKC_API_URL: http://mirakc:40772/api
## to:
```

Write the following in `mirakc-ui/Dockerfile`.

```Dockerfile
FROM docker.io/denoland/deno:2.1.10

WORKDIR /app
EXPOSE 8000

RUN apt-get update && apt-get install -y curl tar
RUN curl -L https://github.com/ansanloms/mirakc-ui/archive/refs/tags/v0.5.12.tar.gz | tar -xz --strip-components 1
RUN rm .env.example
RUN deno cache ./main.ts --allow-import
RUN deno task build

CMD ["run", "-A", "./main.ts"]
```

After launching, you will have access to:

- http://localhost:8888/recording
- http://localhost:8888/program
- http://localhost:8888/search
