# プロジェクト概要

[mirakc](https://github.com/mirakc/mirakc) 向けの Web UI。番組表閲覧、録画管理、番組検索、ライブ視聴機能を提供する。ライブ視聴はトランスコード層を mirakc-ui 内部で実行する A 方式で確定している ([issue #11](https://github.com/ansanloms/mirakc-ui/issues/11))。

## テックスタック

- **クライアント**: Vite + React 19 SPA
- **ルーティング**: TanStack Router（file-based, `client/routes/`）
- **サーバー状態**: TanStack Query + openapi-react-query（`$api`）
- **サーバー**: Hono（Deno）— API プロキシ / トランスコード / 本番の静的配信
- **ランタイム**: Deno 2.x
- **API クライアント**: openapi-fetch + openapi-typescript による型安全な API 呼び出し
- **国際化**: i18next（日本語のみ）
- **スタイリング**: CSS モジュール + グローバル CSS 変数（ライト/ダークモード対応）

> 旧構成は Fresh 2.x（Deno ベースの Island Architecture）だった。Fresh の暗黙的な island 境界が分かりにくいこと、テストの土台が無いことを動機に、Vite + React SPA + Hono へ全面移行した。

## ディレクトリ構成

- `client/` — Vite + React SPA。
  - `routes/` — TanStack Router の file-based ルート。`routeTree.gen.ts` は生成物。
  - `components/` — Atomic Design 構成（atoms → molecules → organisms → templates）。
  - `islands/` — API 非依存の共有 UI（ColorSchemeToggle）と Watch ビュー。「island」は旧構成の名残で、現在は通常の React コンポーネント。
  - `lib/api/` — `$api`（openapi-react-query）クライアントと生成済み `schema.d.ts`。
  - `locales/` — i18next 翻訳。`assets/` — グローバル CSS。
- `server/` — Hono アプリ。`main.ts`（エントリ）、`routes/`（mirakc プロキシ / transcode）、`lib/`（encoder 等）。

## コマンド

```bash
deno task dev        # 開発: Hono(:8000) + Vite(:5173) を並行起動。/api は Vite proxy で Hono へ
deno task dev:client # Vite のみ
deno task dev:server # Hono のみ
deno task build      # 本番ビルド（client/dist に出力）
deno task start      # 本番: Hono が client/dist を配信 + API を提供（:8000）
deno task check      # fmt チェック + lint + 型チェック（CI 相当）
deno task fix        # deno lint --fix + deno fmt で自動修正
deno task test       # deno test（server/lib のロジックテスト等）
deno task generate   # OpenAPI スキーマから client/lib/api/schema.d.ts を再生成
```

lint プラグインとして `@aireone/deno-lint-curly` を使用しており、1 行の `if` でも波括弧が必須。`deno task check` が失敗したら `deno task fix` で多くは解消する。

`nodeModulesDir` は `manual`。依存を追加したら `deno install` で node_modules を作る（Vite が実ディレクトリの node_modules からの解決を要求するため）。
