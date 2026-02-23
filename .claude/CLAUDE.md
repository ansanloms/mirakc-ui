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
deno task dev        # 開発サーバー起動
deno task build      # 本番ビルド（_fresh/ に出力）
deno task start      # ビルド済みアプリを起動（deno serve）
deno task check      # fmt チェック + lint + 型チェック（CI 相当）
deno task generate   # OpenAPI スキーマから hooks/api/schema.d.ts を再生成
```

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

`locales/ja-JP/` にスコープ別翻訳ファイル（common, program, recording, search）を配置。

## 環境変数

- `MIRAKC_API_URL` — mirakc API のベース URL（例: `http://mirakc:40772/api`）。`.env` に設定。

## Docker

マルチステージビルド。linux/amd64, linux/arm64 対応。GitHub Actions で GHCR に自動パブリッシュ。

## Deno 設定の注意点

- `nodeModulesDir: "manual"` — npm 互換性モード
- `jsx: "precompile"` / `jsxImportSource: "preact"`
- `hooks/api/schema.d.ts` と `_fresh/` は lint/fmt の除外対象
