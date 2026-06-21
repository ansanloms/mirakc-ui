FROM --platform=$BUILDPLATFORM docker.io/denoland/deno:2.8.2 AS mirakc-ui-build

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

FROM docker.io/denoland/deno:2.8.2

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

# タイムゾーンはイメージにハードコードしない (中立)。録画通知・録画ファイル名の
# 日時整形はプロセスの TZ 環境変数に依存するため、実行時に渡す
# (compose の environment: か docker run -e TZ=Asia/Tokyo)。未設定なら UTC。
# Deno (V8/ICU) はゾーン情報を内蔵するため tzdata の追加インストールは不要。

# Hono が client/dist を serveStatic しつつ /api を提供する。
# CMD は --env-file を使わず、コンテナの環境変数 (MIRAKC_URL / TZ 等) を直接読む。
CMD ["serve", "-A", "--port", "8000", "server/main.ts"]
