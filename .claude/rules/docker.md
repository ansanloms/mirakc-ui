# Docker (本番)

`Dockerfile` はマルチステージビルドで、linux/amd64 と linux/arm64 に対応する。GitHub Release の公開で GHCR に publish する（`.github/workflows/publish-docker.yml`）。

## タイムゾーン

最終ステージは `TZ` をハードコードしない（中立。地域に依存させない方針）。Node イメージの既定はシステム TZ で、コンテナでは UTC になる。`TZ` 未設定だと録画通知・録画ファイル名が UTC で出る（`server/main.ts` が `Temporal.Now.timeZoneId()` で解決して整形に注入する）。UI の日時表示はブラウザのローカル TZ に従うため `TZ` の影響を受けない。

本番コンテナでは `TZ` を環境変数として渡す（compose の `environment:` か `docker run -e TZ=Asia/Tokyo ...`）。`Asia/Tokyo` 等の解決に追加の `tzdata` インストールは要らない。既定が UTC になることと合わせて、`node:26-bookworm-slim` で 2026-11-15 に実測した。

## PID 1 と終了処理

最終ステージは `tini` を PID 1 にして `node server/main.ts` を起動する。理由: Node を PID 1 で直接動かすと、シグナルの受け取りと子プロセスの回収を Node が担うことになるため。`server/main.ts` は `SIGTERM`/`SIGINT` で接続と KV を閉じて終了する。

## `$BUILDPLATFORM` の使い分け

`mirakc-ui-build` ステージは `--platform=$BUILDPLATFORM` にしている。Buildx が実行ホストのネイティブ platform を割り当てるため、次の 2 つが両立する。

- CI (amd64 runner): `$BUILDPLATFORM` は `linux/amd64` に解決される → QEMU を介さずにビルド
- Raspberry Pi (arm64 ホスト): `$BUILDPLATFORM` は `linux/arm64` に解決される → ネイティブビルド

過去に `--platform=linux/amd64` 固定にしていた時期があるが、QEMU エミュレーションで Vite ビルドが `EISDIR` になる問題の回避が目的だった（[fe770ad](https://github.com/ansanloms/mirakc-ui/commit/fe770ad), [c5ee238](https://github.com/ansanloms/mirakc-ui/commit/c5ee238)）。現在は `$BUILDPLATFORM` 化で両対応（[#14](https://github.com/ansanloms/mirakc-ui/pull/14)）。

## トランスコード層の設計方針

Dockerfile は mirakc-ui 内部で ffmpeg/tsreadex を実行する前提で tsreadex/ffmpeg を同梱する。トランスコード層を外部コンテナに分離する案は image/publish 系統が二重化するコストが過大なため見送り、1 イメージで watch まで完結する内蔵構成で確定した（[#16](https://github.com/ansanloms/mirakc-ui/issues/16)）。
