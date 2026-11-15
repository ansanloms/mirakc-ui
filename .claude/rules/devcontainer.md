# 開発環境 (devcontainer)

`.devcontainer/` に VS Code/`devcontainer` CLI 用の構成を配置。`workspace` と `app` の 2 サービス構成。`workspace` は VS Code/CLI の接続先。`app` は `npm run dev` を起動し、ポート 5173 を公開する。

## セットアップ

1. `cp .devcontainer/.env.example .devcontainer/.env` し、`MIRAKC_URL` を設定。
2. 起動:
   - VS Code: "Reopen in Container"
   - CLI: `devcontainer up --workspace-folder .`
3. `http://localhost:5173/` で UI、`http://localhost:5173/api/mirakc/version` でバックエンドとの疎通を確認（`/api` は Vite proxy 経由で Hono(:8000) に届く）。

## 注意事項

- **Dockerfile を変更した後**: 古い `mirakc-ui-app` イメージがキャッシュされると新しい依存や変更が反映されない。`devcontainer up --remove-existing-container --build-no-cache` で強制再ビルドする。
- **DooD**: `docker-outside-of-docker` feature を使用し、ホストの `/var/run/docker.sock` をバインド。`postStartCommand.sh` でソケット権限を調整している。
- **依存追加後**: `app` を再起動すると、`package-lock.json` の変更を検知して `npm ci` が走り、node_modules が更新される（compose では `node_modules` を named volume にしている）。
- **`docs/api` の依存**: `docs/api` は独立した npm package で、lockfile も別。`npm --prefix ./docs/api ci` で依存を入れる（`npm run generate:internal` の前提）。
- **Node のバージョン**: `.devcontainer/onCreateCommand.sh` の `node@<version>` を `.node-version` などと揃える。揃える箇所の一覧は [project.md](./project.md) の「Node / npm 構成の注意点」を参照。
- **設定系データ**: 設定を保存する SQLite（`/app/data/settings.sqlite3`）も named volume `data`。ホスト側のリポジトリを汚さずコンテナ再作成をまたいで永続化される。消したい場合は `docker volume rm mirakc-ui_data`。
