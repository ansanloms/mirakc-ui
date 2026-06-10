# 環境変数

- `MIRAKC_API_URL` — mirakc API のベース URL（例: `http://mirakc:40772/api`）。`.env`（ホスト実行時）または `.devcontainer/.env`（devcontainer）に設定。
- `VITE_ALLOWED_HOSTS` — Vite dev サーバの `server.allowedHosts` を env から設定する。カンマ区切りのホスト名（例: `raspberrypi.local,.local`）、または `true` / `all` で全許可。未設定なら Vite デフォルト動作。Raspberry Pi 等の非 localhost 経由で開発サーバにアクセスする場合に使用する。
- `API_PORT` — 開発時に Hono（API サーバ）が listen するポート。Vite dev サーバが `/api/*` をこのポートへプロキシする（`vite.config.ts`）。未設定なら `8000`。`deno task dev` も `--port 8000` で Hono を起動する。

環境変数ではないが関連事項: 設定系データ（キーワード自動録画ルール等）は Deno KV（`./data/kv.sqlite3` 固定、`data/` は gitignore 済み）に保存される。Docker 運用では `/app/data` を volume にマウントする。
