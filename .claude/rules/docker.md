# Docker (本番)

マルチステージビルド。linux/amd64, linux/arm64 対応。GitHub Actions で GHCR に自動パブリッシュ。

## ステージ構成

1. `mirakc-ui-build` — Deno イメージで `deno task build` を実行し `_fresh/` を生成。
2. `tsreadex-build` — Debian bookworm-slim。[tsreadex](https://github.com/xtne6f/tsreadex)（`master-240517`）をソースビルドしてバイナリ化。
3. 最終ステージ — Deno イメージに `ffmpeg` を apt で追加し、`tsreadex` バイナリをコピー。実行時に `routes/api/transcode/services/[id].ts` から spawn される。

## `$BUILDPLATFORM` の使い分け

`mirakc-ui-build` ステージは `--platform=$BUILDPLATFORM` にしている。Buildx が実行ホストのネイティブ platform を割り当てるため、

- CI (amd64 runner): `$BUILDPLATFORM` は `linux/amd64` に解決される → QEMU を介さずにビルド
- Raspberry Pi (arm64 ホスト): `$BUILDPLATFORM` は `linux/arm64` に解決される → ネイティブビルド

が両立する。過去に `--platform=linux/amd64` 固定にしていた時期があるが、QEMU エミュレーションで Vite ビルドが `EISDIR` になる問題の回避が目的だった ([fe770ad](https://github.com/ansanloms/mirakc-ui/commit/fe770ad), [c5ee238](https://github.com/ansanloms/mirakc-ui/commit/c5ee238))。現在は `$BUILDPLATFORM` 化で両対応 ([#14](https://github.com/ansanloms/mirakc-ui/pull/14))。

## トランスコード層の設計方針

現行 Dockerfile は A 方式 (mirakc-ui 内部で ffmpeg/tsreadex を実行) 前提で tsreadex / ffmpeg を同梱している。B' 方式 (mirakc の `post-filters` に寄せる、[#16](https://github.com/ansanloms/mirakc-ui/issues/16)) を採用する場合は Dockerfile から `tsreadex-build` ステージと ffmpeg apt インストールを削除してスリム化できる。採用方針は [#11](https://github.com/ansanloms/mirakc-ui/issues/11) / [#16](https://github.com/ansanloms/mirakc-ui/issues/16) で継続検討中。
