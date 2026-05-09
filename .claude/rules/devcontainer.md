# 開発環境 (devcontainer)

`.devcontainer/` に VS Code / `devcontainer` CLI 用の構成を配置。2 サービス構成:

- `workspace` — Debian bookworm ベース。VS Code / CLI の接続先。
- `app` — プロジェクトルートの `Dockerfile` からビルド。`deno task dev --host 0.0.0.0` を起動しポート 5173 を公開。

## セットアップ

1. `cp .devcontainer/.env.example .devcontainer/.env` し、`MIRAKC_API_URL` を設定。
2. 起動:
   - VS Code: "Reopen in Container"
   - CLI: `devcontainer up --workspace-folder .`
3. `http://localhost:5173/` で UI、`http://localhost:5173/api/mirakc/version` でバックエンド疎通を確認。

## 注意事項

- **Dockerfile を変更した後**: 古い `mirakc-ui-app` イメージがキャッシュされると新しい依存や変更が反映されない。`devcontainer up --remove-existing-container --build-no-cache` で強制再ビルドする。
- **DooD**: `docker-outside-of-docker` feature を使用し、ホストの `/var/run/docker.sock` をバインド。`postStartCommand.sh` でソケット権限を調整している。
- **`deno task check/fix` で app コンテナが crash する罠あり** — 対処は [tips.md](./tips.md) 参照。
