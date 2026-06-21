# リリースノート (changelog)

リリースの変更履歴は **GitHub Release の本文** を単一ソースとする。`CHANGELOG.md` も `deno.json` の `version` フィールドも持たない（バージョンの単一ソースは git タグだけ）。リリースは GitHub Release（`release: published`）が `publish-docker.yml` をトリガーして GHCR へ publish する運用。

新しいタグ／リリースを切ったら、この手順で本文を Keep a Changelog 形式（日本語）で書く。0.8.0〜0.10.1 はこの形式で記入済み。

## 文体

本文は成果物なので、対話時の口調（常体・俺/お前）ではなく **通常のドキュメント文体** で書く（コミットメッセージや PR 説明文と同じ扱い）。バレットは体言止めで揃える。

## 手順

### 1. 対象リリースと差分範囲を確定する

- バージョンは git タグのみ。**ローカルタグはリモートに対して古いことがある**（過去にローカルが 0.9.0 まで、リモートが 0.10.1 まで、という乖離があった）。先に `git fetch --tags origin` する。
- リリースの一覧と本文の有無は GitHub 側が正。`gh release list` で確認し、本文未記入は `gh release view <tag> --json body -q '.body'` が空かどうかで判定する。
- 各リリースの差分は「直前タグ..対象タグ」を `git log --oneline --no-merges <prev>..<tag>` で取る。マージコミットは除外する。

### 2. コミットをセクションに分類する

このリポジトリは Conventional Commits が一貫しているので、型でマッピングする。

| commit type | セクション |
| --- | --- |
| `feat` | **Added** |
| `fix` | **Fixed** |
| `refactor` / `style` / `build` / `chore` / `ci` / `perf` | **Changed** |
| 削除・撤去を主目的とするもの（`feat`/`refactor` で「削除」「撤去」） | **Removed** |
| `docs` / `test` | 原則 **本文に出さない**（利用者に影響する場合のみ Changed に含める） |

- 破壊的変更（`feat!` や本文に `BREAKING`、環境変数・API の廃止など）は、本文先頭に引用（`>`）で **破壊的変更** として明示し、Changed にも記載する。例: 0.9.0 の `MIRAKC_API_URL` 廃止。

### 3. キュレーションする（機械的な羅列にしない）

- 先頭にそのリリースを 1 行で要約するリード文を置く。
- 同種の細かいコミット（複数の `refactor` など）は 1 つのバレットにまとめる。
- ノイズは落とすか丸める: `lint` 単独 / `deno.json` 整理 / `build: upgrade` 単独 / `generate` などは個別に出さず、必要なら「依存更新・内部整理」程度にまとめる。
- 文言は利用者視点にする（内部実装名の羅列ではなく、何が変わったか）。

### 4. 本文を書き込む

- 本文に `# 0.10.0` のような見出しは付けない（GitHub Release のタイトルがタグ名になり重複するため）。リード文 + `### Added` / `### Changed` / `### Removed` / `### Fixed` の構成にする。
- 書き込みは一時ファイル経由で行う。日本語の引用符が多くシェルのクォート事故を招くため、本文をファイルに書いて `--notes-file` で渡す。

  ```sh
  gh release edit <tag> --notes-file <path>
  ```

- 書き込み後は `gh release view <tag> --json body -q '.body'` で読み戻して反映を確認する。

### 5. 外向き公開操作の確認

GitHub Release の編集は外向きの公開操作。`gh release edit` を実行する前に、本文ドラフトをユーザに提示して承認を取る。
