# 環境変数

- `MIRAKC_API_URL` — mirakc API のベース URL（例: `http://mirakc:40772/api`）。`.env`（ホスト実行時）または `.devcontainer/.env`（devcontainer）に設定。
- `VITE_ALLOWED_HOSTS` — Vite dev サーバの `server.allowedHosts` を env から設定する。カンマ区切りのホスト名（例: `raspberrypi.local,.local`）、または `true` / `all` で全許可。未設定なら Vite デフォルト動作。Raspberry Pi 等の非 localhost 経由で開発サーバにアクセスする場合に使用する。
