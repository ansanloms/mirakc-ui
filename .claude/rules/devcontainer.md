# 開発環境 (devcontainer)

`.devcontainer/` に VS Code / `devcontainer` CLI 用の構成を配置。2 サービス構成:

- `workspace` — Debian bookworm ベース。VS Code / CLI の接続先。
- `app` — プロジェクトルートの `Dockerfile` からビルド。`deno task dev` を起動する。Hono(:8000) と Vite(:5173) を並行起動し、ポート 5173 を公開する。`vite.config.ts` で `server.host: true` を設定しているため、コンテナ外（ホスト / リモート）からアクセスできる。

## セットアップ

1. `cp .devcontainer/.env.example .devcontainer/.env` し、`MIRAKC_URL` を設定。
2. 起動:
   - VS Code: "Reopen in Container"
   - CLI: `devcontainer up --workspace-folder .`
3. `http://localhost:5173/` で UI、`http://localhost:5173/api/mirakc/version` でバックエンド疎通を確認（`/api` は Vite proxy 経由で Hono(:8000) に届く）。

## 注意事項

- **Dockerfile を変更した後**: 古い `mirakc-ui-app` イメージがキャッシュされると新しい依存や変更が反映されない。`devcontainer up --remove-existing-container --build-no-cache` で強制再ビルドする。
- **DooD**: `docker-outside-of-docker` feature を使用し、ホストの `/var/run/docker.sock` をバインド。`postStartCommand.sh` でソケット権限を調整している。
- **依存追加後**: `deno install` で node_modules を更新する（compose では `node_modules` を named volume にしている）。
- **設定系データ**: Deno KV の SQLite（`/app/data`）も named volume（`data`）。ホスト側のリポジトリを汚さずコンテナ再作成をまたいで永続化される。消したい場合は `docker volume rm mirakc-ui_data`。
- **`deno task check/fix` で app コンテナが crash する罠あり** — 対処は [tips.md](./tips.md) 参照。
