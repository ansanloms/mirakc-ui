FROM --platform=$BUILDPLATFORM docker.io/denoland/deno:2.8.1 AS mirakc-ui-build

WORKDIR /app

COPY . .
RUN deno install
RUN deno task build

FROM docker.io/debian:bookworm-slim AS tsreadex-build

RUN <<EOF
    apt-get update
    apt-get install -y --no-install-recommends g++ cmake make curl ca-certificates
    rm -rf /var/lib/apt/lists/*
EOF

RUN <<EOF
    curl -fsSL https://github.com/xtne6f/tsreadex/archive/refs/tags/master-240517.tar.gz \
        | tar -xz -C /tmp
    mv /tmp/tsreadex-master-240517 /tmp/tsreadex
    cmake -B /tmp/tsreadex/build -S /tmp/tsreadex -DCMAKE_BUILD_TYPE=Release
    cmake --build /tmp/tsreadex/build
EOF

FROM docker.io/denoland/deno:2.8.1

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

RUN <<EOF
    apt-get update
    apt-get install -y --no-install-recommends ffmpeg
    rm -rf /var/lib/apt/lists/*
EOF

COPY --from=tsreadex-build /tmp/tsreadex/build/tsreadex /usr/local/bin/tsreadex
RUN chmod +x /usr/local/bin/tsreadex

WORKDIR /app

COPY deno.json deno.lock ./
RUN deno install
COPY --from=mirakc-ui-build /app/client/dist ./client/dist
COPY server ./server
RUN deno cache server/main.ts

EXPOSE 8000

# Hono が client/dist を serveStatic しつつ /api を提供する。
CMD ["serve", "-A", "--port", "8000", "server/main.ts"]
