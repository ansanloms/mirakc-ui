# mirakc-ui internal API

mirakc-ui のアプリサーバ (Hono) が提供する内部 API である。mirakc のプロキシとは別に、mirakc-ui 自身が永続化する設定系データを扱う。

- キーワード自動録画ルールの CRUD。
- ntfy への録画イベント通知の設定とテスト送信。

LAN 内の個人用アプリを前提とするため認証は設けない。mirakc 由来の API は mirakc 自身の OpenAPI で管理し、この文書には含めない。

## 開発

- `.node-version` に書かれたバージョンの Node が必要。
- `npm ci`: 依存を入れる。
- `npm run lint`: 型検査、oxlint と oxfmt、textlint、redocly lint を順に実行する。
- `npm test`: `bin/` 配下のスクリプトのテストを実行する。
- `npm run fix`: sort と textlint、oxlint、oxfmt の各 fixer を順に実行して最後に lint する (途中で失敗しても続行)。
- `npm run build`: `dist/` に静的サイト (`index.html`、`assets/` 配下の JS・CSS、`api.yaml`、同梱した依存のライセンス一覧 `licenses.md`) を出力する。
- `npm run bundle:json`: `dist/api.json` に参照を展開した JSON の spec を出力する。
- `npm run emit-server-schemas -- <出力先>`: `dist/api.json` の `components.schemas` を TypeScript モジュールとして出力先へ書き出す。先に `npm run bundle:json` が要る。リポジトリ直下の `deno task generate:internal` が、この 2 つを続けて実行して `server/lib/api/internal-schemas.ts` を生成する。
- `npm run dev`: spec を bundle せずに Vite の dev サーバを `http://localhost:4000` で起動する。spec のファイルを編集するとブラウザが再読み込みされる。
- `npm run search`: bundle 済みの spec を読み、全エンドポイントを JSON で出力する。既定では `dist/api.yaml` を読むので、先に `npm run build:bundle` で作っておく。`-- --target <path>` で bundle 済みの別の spec を指定できる。各要素は `method`、`path`、`operationId`、`summary` と、そのエンドポイントが直接または間接に参照する schema の一覧 `schemas` を持つ。jq に渡す場合は npm のヘッダ行を除くため `-s` を付ける。次の例は schema `EnumStatus` を利用しているエンドポイントを出力する。

  ```sh
  npm run -s search | jq -r '.[] | select(.schemas | index("EnumStatus")) | "\(.method) \(.path)"'
  ```

依存は `.npmrc` により正確な版で固定する。自前の 2 パッケージ (textlint-plugin-yaml-keys、redocly-plugin-inline-examples) は GitHub のタグを git 依存で参照しており、Dependabot が更新しないため `package.json` のタグを手で書き換えて `npm install` する。
