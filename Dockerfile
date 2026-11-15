FROM --platform=$BUILDPLATFORM docker.io/node:26-bookworm-slim AS mirakc-ui-build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

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

FROM docker.io/node:26-bookworm-slim

# publish-docker.yml が build-arg で渡す。未使用の build-arg の警告を避けるため宣言だけ残す。
ARG GIT_REVISION

RUN <<EOF
    apt-get update
    apt-get install -y --no-install-recommends ffmpeg tini
    rm -rf /var/lib/apt/lists/*
EOF

COPY --from=tsreadex-build /tmp/tsreadex/build/tsreadex /usr/local/bin/tsreadex
RUN chmod +x /usr/local/bin/tsreadex

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev
COPY --from=mirakc-ui-build /app/client/dist ./client/dist
COPY server ./server

EXPOSE 8000

# タイムゾーンはイメージにハードコードしない (中立)。録画通知・録画ファイル名の
# 日時整形はプロセスの TZ 環境変数に依存するため、実行時に渡す
# (compose の environment: か docker run -e TZ=Asia/Tokyo)。未設定なら UTC。
# Node (V8/ICU) はゾーン情報を内蔵するため tzdata の追加インストールは不要。

# Hono が client/dist を serveStatic しつつ /api を提供する。
# PID 1 で Node を直接動かさず、tini にシグナル転送とゾンビの回収を任せる。
# 環境変数 (MIRAKC_URL / TZ 等) はコンテナの環境から直接読む。
ENTRYPOINT ["tini", "--"]
CMD ["node", "server/main.ts"]
