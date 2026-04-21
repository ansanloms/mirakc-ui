# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

本プロジェクトの開発ルール / 実装知見は `.claude/rules/` 配下にトピック別に分割している。Claude Code は `@path` 記法の import を解決するため、以下のファイルが CLAUDE.md と一緒に読み込まれる。

@./rules/project.md
@./rules/architecture.md
@./rules/watch.md
@./rules/env.md
@./rules/devcontainer.md
@./rules/docker.md
@./rules/deno.md
@./rules/pr-review.md
@./rules/tips.md

## ルール構成の早見

| ファイル | 内容 |
|---|---|
| `rules/project.md` | プロジェクト概要 / テックスタック / コマンド |
| `rules/architecture.md` | Fresh Island / API プロキシ / API フック / スタイリング / 国際化 |
| `rules/watch.md` | ライブ視聴 UI の設計と既知の制限 |
| `rules/env.md` | 環境変数 (`MIRAKC_API_URL`, `VITE_ALLOWED_HOSTS`) |
| `rules/devcontainer.md` | 開発環境 (devcontainer) のセットアップと注意事項 |
| `rules/docker.md` | 本番 Docker のステージ構成と `$BUILDPLATFORM` 運用 |
| `rules/deno.md` | Deno 設定の注意点 |
| `rules/pr-review.md` | Pull Request / Issue の Claude レビュー手順 |
| `rules/tips.md` | 実装・運用の知見 (devcontainer crash / Preact 規約 / stream 管理 / mirakc 連携 等) |

新しい知見を追加するときは対応する rules ファイルに追記する。どのファイルに該当するか迷うものは `rules/tips.md` に書く。
