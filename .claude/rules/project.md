# プロジェクト概要

[mirakc](https://github.com/mirakc/mirakc) 向けの Web UI。番組表閲覧、録画管理、番組検索、ライブ視聴機能を提供する。ライブ視聴はトランスコード層を mirakc-ui 内部で実行する A 方式で確定している ([issue #11](https://github.com/ansanloms/mirakc-ui/issues/11))。

## テックスタック

- **クライアント**: Vite + React 19 SPA
- **ルーティング**: TanStack Router（file-based, `client/routes/`）
- **サーバー状態**: TanStack Query + openapi-react-query（`$api`）
- **サーバー**: Hono（Node.js、`@hono/node-server`）— API プロキシ / トランスコード / 本番の静的配信
- **ランタイム**: Node.js 26（`.node-version`）。パッケージ管理は npm
- **API クライアント**: openapi-fetch + openapi-typescript による型安全な API 呼び出し
- **国際化**: i18next（日本語のみ）
- **スタイリング**: CSS モジュール + グローバル CSS 変数（ライト/ダークモード対応）

> 旧構成は Fresh 2.x（Deno ベースの Island Architecture）だった。Fresh の暗黙的な island 境界が分かりにくいこと、テストの土台が無いことを動機に、Vite + React SPA + Hono へ全面移行した。その後、Deno ランタイムの開発終了を受けて、ランタイムを Deno から Node.js へ移した（[#86](https://github.com/ansanloms/mirakc-ui/issues/86)）。

## ディレクトリ構成

- `client/` — Vite + React SPA。
  - `routes/` — TanStack Router の file-based ルート。`routeTree.gen.ts` は生成物。
  - `components/` — Atomic Design 構成（atoms → molecules → organisms → templates）。
  - `islands/` — API 非依存の共有 UI（ColorSchemeToggle）と Watch ビュー。「island」は旧構成の名残で、現在は通常の React コンポーネント。
  - `hooks/` — 再利用する React フック（`use-debounced-value` / `use-now` / `use-program-queries` 等）。`use-*` 命名のフックはここに置く。
  - `lib/api/` — `$api`（openapi-react-query）クライアントと生成済み `schema.d.ts`。
  - `locales/` — i18next 翻訳。`assets/` — グローバル CSS。
- `server/` — Hono アプリ。`main.ts`（エントリ）、`routes/`（mirakc プロキシ / transcode / 設定系 API）、`lib/`（encoder・純粋ロジック等）、`store/`（`node:sqlite` の KV ラッパーと設定系ストア）、`locales/`（server 発の表示文言）。
- `docs/api/` — 内部 API の OpenAPI。独立した npm package（自前の `package.json` と `package-lock.json` を持つ）。

## コマンド

```bash
npm run dev        # 開発: Hono(:8000) + Vite(:5173) を並行起動。/api は Vite proxy で Hono へ
npm run dev:client # Vite のみ
npm run dev:server # Hono のみ
npm run build      # 本番ビルド（client/dist に出力）
npm run start      # 本番: Hono が client/dist を配信 + API を提供（:8000）
npm run check      # 型チェック（tsc --noEmit）
npm run lint       # lint（oxlint）+ 整形の検査（oxfmt --check）
npm run fix        # oxlint --fix + oxfmt で自動修正
npm run test       # server（node --test）→ client（Vitest）の順にテスト
npm run generate   # 生成物を再生成（client/lib/api/schema.d.ts と server/lib/api/internal-schemas.ts）
```

`lint` は `lint:oxlint` と `lint:oxfmt`、`fix` は `fix:oxlint` と `fix:oxfmt` を順に実行する。oxlint は `curly` ルールを有効にしており（`.oxlintrc.json`）、1 行の `if` でも波括弧が必須。`npm run lint` が失敗したら `npm run fix` で多くは解消する。

`npm run check` は生成物 `client/routeTree.gen.ts`（gitignore 対象）を要する。このファイルは `npm run build`（または dev サーバ）が生成するので、新しい checkout では先に `npm run build` を流す。

`npm run generate` は `generate:*` を全て実行するため、`docs/api` の OpenAPI から `server/lib/api/internal-schemas.ts` を生成する `generate:internal` も含む。`generate:internal` は `docs/api` の script を呼ぶので、`npm run generate` の前に `npm --prefix ./docs/api ci` で `docs/api` の依存を入れておく必要があり、未実施だと `redocly: not found` で失敗する。

## Node / npm 構成の注意点

- **`.npmrc`**: `save-exact=true`（版を範囲ではなく正確な値で記録する）、`ignore-scripts=true`（依存の install script を実行しない）、`min-release-age=7`（公開から 7 日未満の版を入れない）。依存を追加・更新したら `npm install` で `package-lock.json` を更新する。CI と Docker は `npm ci` で lockfile どおりに入れる。
- **TypeScript は 6 系に留める**: ルートの `typescript` は `6.0.3`。7 は JS API を持たず、`generate:mirakc` が使う `openapi-typescript` が実行時に失敗する（`ts.factory` が undefined）。`openapi-typescript` の peer（`^5.x`）は、`package.json` の `overrides` で 6.0.3 に合わせている。`openapi-typescript` が 7 に対応するまで上げない。`docs/api` は `openapi-typescript` を使わないので 7 系。
- **生成物の扱い**: `client/routeTree.gen.ts`・`client/lib/api/schema.d.ts`・`server/lib/api/internal-schemas.ts` は oxfmt / oxlint からは除外する（`.oxfmtrc.json`・`.oxlintrc.json` の `ignorePatterns`）が、型チェックには**含める**（`tsconfig.json` の `include` が `client` と `server` を対象にする）。`routeTree.gen.ts` の `declare module` による TanStack Router の Register 拡張と、`schema.d.ts` の `paths` 型が型解決に必須なため。
- **TanStack Router の生成 import**: `vite.config.ts` の `tanstackRouter({ addExtensions: true })` で `routeTree.gen.ts` の import に `.tsx` を付与する。`tsconfig.json` の `allowImportingTsExtensions` と揃え、拡張子付きの import で統一するため。`client/main.tsx` の `routeTree.gen.ts` import も拡張子付きにする。
- **mpegts.js / aribb24.js**: どちらも npm から入れる。`mpegts.js` は `1.8.2` 以上を使う（`1.8.0` は `github:` 依存を持ち、npm で入らない）。
- **oxfmt / oxlint の対象**: ルートの oxfmt / oxlint は `docs/api` 配下も対象にする。`docs/api` は自前の oxfmt / oxlint を持たない。oxfmt・oxlint とも、配下に設定ファイルがあると親の `ignorePatterns` がその配下に効かず、設定ファイルだけでは `docs/api` を切り離せないため、版を 1 つにしてルートに寄せている。
- **Node のバージョン**: `.node-version`、`docs/api/.node-version`、`Dockerfile` の `FROM docker.io/node:<version>-bookworm-slim`（2 箇所）、`.devcontainer/onCreateCommand.sh` の `node@<version>`、`package.json` の `engines` を揃える。上げる際は同時に更新する。CI（`.github/workflows/check.yml`）は `.node-version` を読む。
