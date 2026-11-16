# プロジェクト概要

[mirakc](https://github.com/mirakc/mirakc) 向けの Web UI。番組表閲覧、録画管理、番組検索、ライブ視聴機能を提供する。クライアントは Vite + React の SPA（`client/`）。サーバは Hono on Node.js（`server/`）。内部 API の OpenAPI を `docs/api/`（独立した npm package。lockfile も別）に持つ。

## 作業の前提

- 新しい checkout では `npm ci` → `npm run build` → `npm run check` → `npm run lint` → `npm run test` → `npm run storybook:build` の順に流す。CI（`.github/workflows/check.yml`）も同じ順で検証する。
- `npm run check`（型チェック）は生成物 `client/routeTree.gen.ts` を要する。このファイルは gitignore 対象で、`npm run build`（または dev サーバ）が生成するので、`npm run check` より先に `npm run build` を流す。
- `npm run generate` に含まれる `generate:internal` は `docs/api` の script を呼ぶ。先に `npm --prefix ./docs/api ci` で `docs/api` の依存を入れておかないと、`redocly: not found` で失敗する。
- oxlint は `curly` ルールを有効にしており（`.oxlintrc.json`）、1 行の `if` でも波括弧が必須。`npm run lint` が失敗したら `npm run fix` で多くは解消する。
- 環境変数の説明は `.env.example` にある。`KEYWORD_RECORDING_INTERVAL_MINUTES`（キーワード自動録画のフォールバック実行間隔。単位は分、既定は 60）だけは `.env.example` に無い。
- `client/islands/` は旧構成の名残の名前で、中身は通常の React コンポーネント。

## 決めごと

- 純粋共有モジュール: `server/lib/` のうち client も実行時に import するモジュール（`quality.ts`・`keyword-rules.ts`・`notification-settings.ts`・`live-comment-settings.ts`・`comments/types.ts` 等）は、ブラウザでも動くよう、`node:` モジュールなどランタイム固有の API に依存させない。入力の検証と判定は、server と client で同じロジックを使う。
- 内部 API の単一ソース: 内部 API の型と構造検証は、`docs/api` の OpenAPI から生成した `server/lib/api/internal-schemas.ts` を使う。OpenAPI を変えたら `npm run generate:internal` で再生成する（CI が再生成との差分を検査する）。
- 画質プリセット: `server/lib/quality.ts` が単一ソース。client と server の両方がここを参照する。
- 設定系データ: KV（`server/store/kv.ts`）の `["settings", ...]` 名前空間に置く。設定系ページは `/settings/` 配下に集約する。
- キーワード録画: ルールを削除しても、登録済みの予約は取り消さない。
- 通知設定の API: token を平文で返す。理由: LAN 内の個人用アプリを前提とし、認証を設けないため。
- 旧データ: 0.10.x 以前の Deno 版が Deno KV（`kv.sqlite3`）に保存した設定は引き継がない。
- 表示文言: `client/locales/` と `server/locales/` で管理する。ログと API のエラーメッセージは表示文言ではないので対象外。
- トランスコード: ライブ視聴のトランスコードは ffmpeg・tsreadex を mirakc-ui 内部で実行する方式で確定している（[#11](https://github.com/ansanloms/mirakc-ui/issues/11)・[#16](https://github.com/ansanloms/mirakc-ui/issues/16)）。

## Node / npm 構成の注意点

- `.npmrc`: 次の 3 つを設定している。依存を追加・更新したら `npm install` で `package-lock.json` を更新する。CI と Docker は `npm ci` で lockfile どおりに入れる。
  - `save-exact=true`: 版を範囲ではなく正確な値で記録する。
  - `ignore-scripts=true`: 依存の install script を実行しない。
  - `min-release-age=7`: 公開から 7 日未満の版を入れない。
- TypeScript は 6 系に留める: ルートの `typescript` は `6.0.3`。`openapi-typescript` が 7 に対応するまで上げない。
  - 理由: 7 は JS API を持たず、`generate:mirakc` が使う `openapi-typescript` が実行時に失敗する（`ts.factory` が undefined）。
  - CI は `generate:mirakc` を実行しない（実機の mirakc が要るため）ので、この失敗を検知しない。7 へ上げる PR は、CI が通っていてもマージしない。
  - `openapi-typescript` の peer（`^5.x`）は `package.json` の `overrides` で 6.0.3 に合わせている。
  - `docs/api` は `openapi-typescript` を使わないので 7 系。
- 生成物の扱い: `client/routeTree.gen.ts`・`client/lib/api/schema.d.ts`・`server/lib/api/internal-schemas.ts` は oxfmt・oxlint からは除外する（`.oxfmtrc.json`・`.oxlintrc.json` の `ignorePatterns`）。ただし、型チェックには含める（`tsconfig.json` の `include` が `client` と `server` を対象にする）。理由: `routeTree.gen.ts` の `declare module` による TanStack Router の Register 拡張と、`schema.d.ts` の `paths` 型が型解決に必須なため。
- TanStack Router の生成 import: `vite.config.ts` の `tanstackRouter({ addExtensions: true })` で `routeTree.gen.ts` の import に `.tsx` を付与する。理由: `tsconfig.json` の `allowImportingTsExtensions` と揃え、拡張子付きの import で統一するため。`client/main.tsx` の `routeTree.gen.ts` import も拡張子付きにする。
- mpegts.js: `1.8.2` 以上を使う（`1.8.0` は `github:` 依存を持ち、npm で入らない）。
- oxfmt・oxlint の対象: ルートの oxfmt・oxlint は `docs/api` 配下も対象にする。`docs/api` は自前の oxfmt・oxlint を持たない。理由: oxfmt・oxlint のバージョンをリポジトリで 1 つにするため。また oxfmt・oxlint とも、配下に設定ファイルがあると親の `ignorePatterns` がその配下に適用されず、設定ファイルだけでは `docs/api` を切り離せないため。
- Node のバージョン: `.node-version`、`docs/api/.node-version`、`Dockerfile` の `FROM docker.io/node:<version>-bookworm-slim`（2 箇所）、`package.json` の `engines` を揃える。上げる際は同時に更新する。CI（`.github/workflows/check.yml`）は `.node-version` を読む。
