# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

[mirakc](https://github.com/mirakc/mirakc) 向けの Web UI。番組表閲覧、録画管理、番組検索機能を提供する。

## テックスタック

- **フレームワーク**: Fresh 2.x（Deno ベース）
- **UI**: Preact + @preact/signals
- **ビルド**: Vite（`vite.config.ts` に CSS 強制注入カスタムプラグインあり）
- **ランタイム**: Deno 2.x
- **API クライアント**: openapi-fetch + openapi-typescript による型安全な API 呼び出し
- **国際化**: i18next（日本語のみ）
- **スタイリング**: CSS モジュール + グローバル CSS 変数（ライト/ダークモード対応）

## コマンド

```bash
deno task dev        # 開発サーバー起動（vite、ポート 5173）
deno task build      # 本番ビルド（_fresh/ に出力）
deno task start      # ビルド済みアプリを起動（deno serve）
deno task check      # fmt チェック + lint + 型チェック（CI 相当）
deno task fix        # deno lint --fix + deno fmt で自動修正
deno task generate   # OpenAPI スキーマから hooks/api/schema.d.ts を再生成
```

lint プラグインとして `@aireone/deno-lint-curly` を使用しており、1 行の `if` でも波括弧が必須。`deno task check` が失敗したら `deno task fix` で多くは解消する。

## アーキテクチャ

### Fresh の Island Architecture

- `routes/` — ファイルシステムベースルーティング。サーバーサイドレンダリング。
- `islands/` — クライアント側でハイドレーションされるインタラクティブコンポーネント。
- `components/` — Atomic Design 構成（atoms → molecules → organisms → templates）。

### API プロキシ

`routes/api/mirakc/[...path].ts` が mirakc バックエンドへのプロキシとして機能する。環境変数 `MIRAKC_API_URL` でバックエンド URL を指定する。CORS 回避のためサーバーサイドプロキシパターンを採用。

### API フック

`hooks/api/` に `useGet`, `usePost`, `useDelete` を提供。`openapi-fetch` と生成された `schema.d.ts` により完全な型安全性を実現。状態遷移: `before` → `pending` → `fulfilled/rejected`。

### スタイリング

- `assets/styles/palette.css` — CSS 変数によるカラートークン。`light-dark()` 関数でテーマ切り替え。ジャンル別カラー（16色）定義。
- コンポーネントスコープは `.module.css` で管理。
- `vite.config.ts` の `force-inject-all-css` プラグインにより、ビルド時に全 CSS を島コンポーネントに強制注入（モジュール CSS の読み込み漏れ対策）。

### 国際化

`locales/ja-JP/` にスコープ別翻訳ファイル（common, program, recording, search, watch）を配置。

### ライブ視聴とトランスコード

- **ページ**: `/watch/[serviceId]`。`islands/Watch.tsx` がプレイヤー島、`components/organisms/Watch/` に UI 部品。
- **トランスコード API**: `routes/api/transcode/services/[id].ts`。パイプラインは mirakc のサービスストリーム → `tsreadex`（字幕・音声整形）→ `ffmpeg`（H.264 / AAC に再エンコード）→ MPEG-TS をチャンク応答。
- **再生**: `mpegts.js`（MSE ベース）で `<video>` にアタッチ、`aribb24.js` で ARIB 字幕を canvas オーバーレイ。
- **HW エンコーダー自動検出**: 起動時に `h264_v4l2m2m` と `libx264` を順に**実エンコードテスト (probe)** で検証し、成功した方をキャッシュ。WSL2 等でカーネルモジュール不在の場合は `libx264` にフォールバック。両方失敗時は `503 No usable H.264 encoder found` を返す。
- **デバッグログ**: tsreadex / ffmpeg / encoder-probe の stderr は `[tsreadex]` / `[ffmpeg]` / `[encoder-probe ${name}]` のプレフィックス付きで `console.error` に出力する (`docker logs mirakc-ui-app-1` で確認可)。
- **URL 状態管理**: `serviceId` はパスパラメータ、`audioTrack` / `quality` / `caption` はクエリパラメータ。

## 環境変数

- `MIRAKC_API_URL` — mirakc API のベース URL（例: `http://mirakc:40772/api`）。`.env`（ホスト実行時）または `.devcontainer/.env`（devcontainer）に設定。

## 開発環境（devcontainer）

`.devcontainer/` に VS Code / `devcontainer` CLI 用の構成を配置。2 サービス構成:

- `workspace` — Debian bookworm ベース。VS Code / CLI の接続先。
- `app` — プロジェクトルートの `Dockerfile` からビルド。`deno task dev --host 0.0.0.0` を起動しポート 5173 を公開。

### セットアップ

1. `cp .devcontainer/.env.example .devcontainer/.env` し、`MIRAKC_API_URL` を設定。
2. 起動:
   - VS Code: "Reopen in Container"
   - CLI: `devcontainer up --workspace-folder .`
3. `http://localhost:5173/` で UI、`http://localhost:5173/api/mirakc/version` でバックエンド疎通を確認。

### 注意事項

- **Dockerfile を変更した後**: 古い `mirakc-ui-app` イメージがキャッシュされると tsreadex / ffmpeg が入らない状態になる。`devcontainer up --remove-existing-container --build-no-cache` で強制再ビルドする。
- **DooD**: `docker-outside-of-docker` feature を使用し、ホストの `/var/run/docker.sock` をバインド。`postStartCommand.sh` でソケット権限を調整している。

## Docker（本番）

マルチステージビルド。linux/amd64, linux/arm64 対応。GitHub Actions で GHCR に自動パブリッシュ。

ステージ構成:

1. `mirakc-ui-build` — Deno イメージで `deno task build` を実行し `_fresh/` を生成。
2. `tsreadex-build` — Debian bookworm-slim。[tsreadex](https://github.com/xtne6f/tsreadex)（`master-240517`）をソースビルドしてバイナリ化。
3. 最終ステージ — Deno イメージに `ffmpeg` を apt で追加し、`tsreadex` バイナリをコピー。実行時に `routes/api/transcode/services/[id].ts` から spawn される。

## Deno 設定の注意点

- `nodeModulesDir: "manual"` — npm 互換性モード
- `jsx: "precompile"` / `jsxImportSource: "preact"`
- `hooks/api/schema.d.ts` と `_fresh/` は lint/fmt の除外対象
