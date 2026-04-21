# Docker (本番)

マルチステージビルド。linux/amd64, linux/arm64 対応。GitHub Actions で GHCR に自動パブリッシュ。

## ステージ構成

1. `mirakc-ui-build` — Deno イメージで `deno task build` を実行し `_fresh/` を生成。
2. 最終ステージ — Deno イメージに `_fresh/` をコピーして `deno serve` で起動。

## `$BUILDPLATFORM` の使い分け

build ステージは `--platform=$BUILDPLATFORM` にしている。Buildx が実行ホストのネイティブ platform を割り当てるため、

- CI (amd64 runner): `$BUILDPLATFORM` は `linux/amd64` に解決される → QEMU を介さずにビルド
- Raspberry Pi (arm64 ホスト): `$BUILDPLATFORM` は `linux/arm64` に解決される → ネイティブビルド

が両立する。過去に `--platform=linux/amd64` 固定にしていた時期があるが、QEMU エミュレーションで Vite ビルドが `EISDIR` になる問題の回避が目的だった ([fe770ad](https://github.com/ansanloms/mirakc-ui/commit/fe770ad), [c5ee238](https://github.com/ansanloms/mirakc-ui/commit/c5ee238))。現在は `$BUILDPLATFORM` 化で両対応 ([#14](https://github.com/ansanloms/mirakc-ui/pull/14))。

## トランスコード層採用時の差分

- [#11 A 方式](https://github.com/ansanloms/mirakc-ui/issues/11) を採用する場合はこの最終ステージに `ffmpeg` / `tsreadex` を追加する
- [#16 B' 方式](https://github.com/ansanloms/mirakc-ui/issues/16) を採用する場合は Dockerfile は触らず、mirakc 側の `post-filters` 設定で扱う
