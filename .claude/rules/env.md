# 環境変数

ホスト実行時の雛形はリポジトリ直下の `.env.example`（`cp .env.example .env` して編集）。devcontainer 用は `.devcontainer/.env.example`。

- `MIRAKC_URL` — mirakc のベース URL（例: `http://mirakc:40772`）。Web API（`/api`）と SSE（`/events`）はここから組み立てる（`server/lib/mirakc.ts` の `mirakcApiUrlOf` / `mirakcEventsUrlOf`）。`.env`（ホスト実行時）または `.devcontainer/.env`（devcontainer）に設定。旧 `MIRAKC_API_URL`（`/api` まで含む形）は廃止した。
- `VITE_ALLOWED_HOSTS` — Vite dev サーバの `server.allowedHosts` を env から設定する。カンマ区切りのホスト名（例: `raspberrypi.local,.local`）、または `true` / `all` で全許可。未設定なら Vite デフォルト動作。Raspberry Pi 等の非 localhost 経由で開発サーバにアクセスする場合に使用する。
- `API_PORT` — 開発時に Hono（API サーバ）が listen するポート。Vite dev サーバが `/api/*` をこのポートへプロキシする（`vite.config.ts`）。未設定なら `8000`。`deno task dev` も `--port 8000` で Hono を起動する。

- `TZ` — server 側の日時整形に使うタイムゾーン（IANA タイムゾーン ID、例: `Asia/Tokyo`）。標準の `TZ` 環境変数で、`server/main.ts` が `Temporal.Now.timeZoneId()` で 1 度だけ解決し、録画通知・録画ファイル名の整形（`notifyProgramEvent` / `startKeywordRecordingJob` に注入）に使う。未設定なら実行環境の既定（**Docker コンテナでは UTC**）。通知の時刻が UTC になる場合はこれを設定する。`.env`（ホスト実行・`--env-file`）／`.devcontainer/.env`／本番コンテナの環境変数（compose の `environment:` や `docker run -e TZ=...`）で渡す。クライアント（UI）の日時表示はブラウザのローカル TZ に従い、この値とは独立（`client/lib/datetime.ts`）。
- `DATA_DIR` — 設定系データ（キーワード自動録画ルール・通知設定）の保存先ディレクトリ。Deno KV の SQLite が `${DATA_DIR}/kv.sqlite3` に置かれる（`server/store/kv.ts`）。未設定なら `./data`（gitignore 済み）。Docker 運用では既定のまま `/app/data` を volume にマウントするのが簡単。
- `KEYWORD_RECORDING_INTERVAL_MINUTES` — キーワード自動録画ジョブのフォールバック実行間隔（分）。未設定・不正値・1 未満なら `60`。主トリガは mirakc の `epg.programs-updated`（SSE）で、起動直後にも 1 回実行される。
