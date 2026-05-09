# アーキテクチャ

## Fresh の Island Architecture

- `routes/` — ファイルシステムベースルーティング。サーバーサイドレンダリング。
- `islands/` — クライアント側でハイドレーションされるインタラクティブコンポーネント。
- `components/` — Atomic Design 構成（atoms → molecules → organisms → templates）。

## API プロキシ

`routes/api/mirakc/[...path].ts` が mirakc バックエンドへのプロキシとして機能する。環境変数 `MIRAKC_API_URL` でバックエンド URL を指定する。CORS 回避のためサーバーサイドプロキシパターンを採用。

## API フック

`hooks/api/` に `useGet`, `usePost`, `useDelete` を提供。`openapi-fetch` と生成された `schema.d.ts` により完全な型安全性を実現。状態遷移: `before` → `pending` → `fulfilled/rejected`。戻り値は `{ state, data, error, loading, mutate }`。

## スタイリング

- `assets/styles/palette.css` — CSS 変数によるカラートークン。`light-dark()` 関数でテーマ切り替え。ジャンル別カラー（16色）定義。
- コンポーネントスコープは `.module.css` で管理。
- `vite.config.ts` の `force-inject-all-css` プラグインにより、ビルド時に全 CSS を島コンポーネントに強制注入（モジュール CSS の読み込み漏れ対策）。

## 国際化

`locales/ja-JP/` にスコープ別翻訳ファイル（common, program, recording, search, watch）を配置。
