# Docker (本番)

マルチステージビルド。linux/amd64, linux/arm64 対応。GitHub Actions で GHCR に自動パブリッシュ。

## ステージ構成

1. `mirakc-ui-build` — Deno イメージで `deno install` + `deno task build` を実行し `client/dist`（Vite ビルド成果物）を生成。
2. `tsreadex-build` — Debian bookworm-slim。[tsreadex](https://github.com/xtne6f/tsreadex)（`master-240517`）をソースビルドしてバイナリ化。
3. 最終ステージ — Deno イメージに `ffmpeg` を apt で追加し、`tsreadex` バイナリ・`client/dist`・`server/` をコピー。`deno serve server/main.ts`（Hono）で起動し、`client/dist` を `serveStatic` で配信しつつ `/api`（mirakc プロキシ / transcode）を提供する。`server/routes/transcode.ts` から `ffmpeg` / `tsreadex` を spawn する。

> 旧構成は Fresh の `_fresh/server.js` を `deno serve` していた。本番起動は Hono の `server/main.ts` に置き換わった。

## タイムゾーン

最終ステージは `TZ` をハードコードしない（中立。地域に依存させない方針）。Deno イメージの既定はシステム TZ で、コンテナでは **UTC** になる。`TZ` 未設定だと録画通知・録画ファイル名が UTC で出る（`server/main.ts` が `Temporal.Now.timeZoneId()` で解決して整形に注入する。[env.md](./env.md) の `TZ` を参照）。UI の日時表示はブラウザのローカル TZ に従うため `TZ` の影響を受けない。

本番コンテナでは `TZ` を環境変数として渡す（compose の `environment:` か `docker run -e TZ=Asia/Tokyo ...`）。Deno（V8/ICU）はゾーン情報を内蔵するため、`Asia/Tokyo` 等の解決に追加の `tzdata` インストールは要らない。

## `$BUILDPLATFORM` の使い分け

`mirakc-ui-build` ステージは `--platform=$BUILDPLATFORM` にしている。Buildx が実行ホストのネイティブ platform を割り当てるため、

- CI (amd64 runner): `$BUILDPLATFORM` は `linux/amd64` に解決される → QEMU を介さずにビルド
- Raspberry Pi (arm64 ホスト): `$BUILDPLATFORM` は `linux/arm64` に解決される → ネイティブビルド

が両立する。過去に `--platform=linux/amd64` 固定にしていた時期があるが、QEMU エミュレーションで Vite ビルドが `EISDIR` になる問題の回避が目的だった（[fe770ad](https://github.com/ansanloms/mirakc-ui/commit/fe770ad), [c5ee238](https://github.com/ansanloms/mirakc-ui/commit/c5ee238)）。現在は `$BUILDPLATFORM` 化で両対応（[#14](https://github.com/ansanloms/mirakc-ui/pull/14)）。

## トランスコード層の設計方針

Dockerfile は A 方式（mirakc-ui 内部で ffmpeg/tsreadex を実行）前提で tsreadex / ffmpeg を同梱する。トランスコード層を外部コンテナに分離する案（C 方式）は image / publish 系統が二重化するコストが過大なため見送り、1 イメージで watch まで完結する内蔵構成で確定した（[#16](https://github.com/ansanloms/mirakc-ui/issues/16)）。
