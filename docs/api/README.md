# mirakc-ui internal API

mirakc-ui のアプリサーバ (Hono) が提供する内部 API である。mirakc のプロキシとは別に、mirakc-ui 自身が永続化する設定系データを扱う。

- キーワード自動録画ルールの CRUD。
- ntfy への録画イベント通知の設定とテスト送信。

LAN 内の個人用アプリを前提とするため認証は設けない。mirakc 由来の API は mirakc 自身の OpenAPI で管理し、この文書には含めない。

## 開発

- `.node-version` に書かれたバージョンの Node が必要。
- `npm ci`: 依存を入れる。
- `npm run lint`: 型検査、textlint、redocly lint を順に実行する。整形と lint (oxfmt・oxlint) はこの package では行わず、リポジトリ直下の `npm run lint` が `docs/api` 配下も対象にして行う。
- `npm test`: `bin/` 配下のスクリプトのテストを実行する。
- `npm run fix`: sort と textlint の fixer を順に実行して最後に lint する (途中で失敗しても続行)。整形の自動修正はリポジトリ直下の `npm run fix` が `docs/api` 配下も対象にして行う。
- `npm run build`: `dist/` に `index.html` (Redoc の JS を埋め込んだ単一の HTML) と `api.yaml` を出力する。
- `npm run bundle:json`: `dist/api.json` に参照を展開した JSON の spec を出力する。
- `npm run emit-server-schemas -- <出力先>`: `dist/api.json` の `components.schemas` を TypeScript モジュールとして出力先へ書き出す。先に `npm run bundle:json` が要る。リポジトリ直下の `npm run generate:internal` が、この 2 つを続けて実行して `server/lib/api/internal-schemas.ts` を生成する。
- `npm run dev`: Vite の dev サーバを `http://localhost:4000` で起動する。dev サーバは spec を `redocly build-docs` で HTML にして返す。spec のファイルを編集すると HTML が作り直され、ブラウザが再読み込みされる。

依存は `.npmrc` により正確な版で固定する。自前の 2 パッケージ (textlint-plugin-yaml-keys、redocly-plugins) は GitHub のタグを git 依存で参照しており、Dependabot が更新しないため `package.json` のタグを手で書き換えて `npm install` する。
