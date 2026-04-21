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

### ライブ視聴 (UI 骨組み)

- **ページ**: `/watch`（サービス一覧）/ `/watch/[serviceId]`（プレイヤー）。`islands/Watch.tsx` がプレイヤー島、`components/organisms/Watch/` に UI 部品。
- **ストリーム**: 現状は `/api/mirakc/services/:id/stream?decode=1`（mirakc 生ストリーム、MPEG-2 Video）を直接プロキシするのみ。ブラウザ（MSE）では映像は再生できない。Player 上部に「視聴機能は別 PR で実装予定」の告知を表示する。
- **再生ライブラリ**: `mpegts.js`（MSE）+ `aribb24.js`（ARIB 字幕）。映像トランスコードが未配線でも、字幕 PES が含まれていれば aribb24.js 経由で canvas にレンダリングされる場合がある。
- **URL 状態管理**: `serviceId` はパスパラメータ、`audioTrack` / `quality` / `caption` はクエリパラメータ。
- **サービス一覧**: 物理チャンネル (`channel.type` + `channel.channel`) + サービス名の組で重複排除（mirakc は 1 物理チャンネルに主サービス / 副サービス / 1 セグ等を別 serviceId として返すため）。
- **トランスコード層は未実装**: H.264 / AAC への再エンコードは本リポジトリ別 issue ([#11](https://github.com/ansanloms/mirakc-ui/issues/11) A 方式 / [#16](https://github.com/ansanloms/mirakc-ui/issues/16) B' 方式) で実装する。採用方針が固まるまで UI のみ先行マージ。
- **既知の制限**: ブラウザウィンドウを拡大しすぎると ARIB 字幕がほぼ表示されなくなる (aribb24.js 2.0.12 の描画バグ、詳細は [issue #15](https://github.com/ansanloms/mirakc-ui/issues/15))。字幕を見たい場合はウィンドウ幅を 1280px 程度に抑える。

## 環境変数

- `MIRAKC_API_URL` — mirakc API のベース URL（例: `http://mirakc:40772/api`）。`.env`（ホスト実行時）または `.devcontainer/.env`（devcontainer）に設定。
- `VITE_ALLOWED_HOSTS` — Vite dev サーバの `server.allowedHosts` を env から設定する。カンマ区切りのホスト名（例: `raspberrypi.local,.local`）、または `true` / `all` で全許可。未設定なら Vite デフォルト動作。Raspberry Pi 等の非 localhost 経由で開発サーバにアクセスする場合に使用する。

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

- **Dockerfile を変更した後**: 古い `mirakc-ui-app` イメージがキャッシュされると新しい依存や変更が反映されない。`devcontainer up --remove-existing-container --build-no-cache` で強制再ビルドする。
- **DooD**: `docker-outside-of-docker` feature を使用し、ホストの `/var/run/docker.sock` をバインド。`postStartCommand.sh` でソケット権限を調整している。

## Docker（本番）

マルチステージビルド。linux/amd64, linux/arm64 対応。GitHub Actions で GHCR に自動パブリッシュ。

ステージ構成:

1. `mirakc-ui-build` — Deno イメージで `deno task build` を実行し `_fresh/` を生成。
2. 最終ステージ — Deno イメージに `_fresh/` をコピーして `deno serve` で起動。

トランスコード層 ([#11](https://github.com/ansanloms/mirakc-ui/issues/11) A 方式) を採用する場合はこの最終ステージに `ffmpeg` / `tsreadex` を追加する。別方式 ([#16](https://github.com/ansanloms/mirakc-ui/issues/16) B' 方式) を採用する場合は Dockerfile は触らず、mirakc 側の `post-filters` 設定で扱う。

## Deno 設定の注意点

- `nodeModulesDir: "manual"` — npm 互換性モード
- `jsx: "precompile"` / `jsxImportSource: "preact"`
- `hooks/api/schema.d.ts` と `_fresh/` は lint/fmt の除外対象
