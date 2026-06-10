# キーワード自動録画 (ルール管理)

キーワード + 任意の期間・チャンネル・ジャンルで自動録画ルールを登録・管理する機能。UI は Claude Design のハンドオフ（キーワード録画.html）準拠。ルールに基づく自動予約ジョブと通知（ntfy / mirakc events）は後続 PR で追加する。

## ルールのデータモデル

`server/lib/keyword-rules.ts`（純粋共有モジュール）の `KeywordRule`:

- `keyword` — 番組名（name のみ、description は対象外）の部分一致。大文字小文字無視
- `from` / `to` — ローカル日付 `YYYY-MM-DD`、両端含む。未指定は無制限
- `serviceIds` — Mirakurun の複合 service id の配列。空 = 全チャンネル
- `genres` — ARIB lv1 コード (0..15) の配列。空 = 全ジャンル（交差判定）
- `enabled` — 停止中は自動予約の対象外

一致判定 `matchesKeywordRule` と入力検証 `parseKeywordRuleInput` もここに置き、server（API・将来の録画ジョブ）と client（一致プレビュー・件数）が**同一ロジックを runtime import** する（`server/lib/quality.ts` と同じ共有パターン。Deno API 依存を持たせないこと）。

## 構成

- **永続化**: `server/lib/keyword-rules-store.ts`。Deno KV（SQLite、パスは `./data/kv.sqlite3` 固定）。キーは `["settings", "keyword-rules", <id>]` — 今後の設定系データも `["settings", ...]` 名前空間に追加する。KV 利用のため `deno.json` に `unstable: ["kv"]` と `compilerOptions.lib` の `deno.unstable` を設定済み。テストは `new KeywordRuleStore(":memory:")`。
- **CRUD API**: `server/routes/keyword-rules.ts` を `/api/keyword-rules` にマウント。GET（一覧）/ POST（追加）/ PUT `/:id`（全項目上書き、有効・停止トグルもこれ）/ DELETE `/:id`。

## client

- `/settings/keywords` ルート（`client/routes/settings/keywords.tsx`、レイアウト）。番組表ツールバーの `KeywordRulesTrigger` から遷移。設定系ページは `/settings/` 配下に集約する方針（今後 `/settings/notification` を追加し、`/settings` をポータル化する想定）。
- 登録/編集モーダルは URL と対応する子ルートが描画し、レイアウトの `<Outlet/>`（template の `children`）として一覧の上に重なる（番組表のモーダルと同じパターン）:
  - 新規: `/settings/keywords/new`（`client/routes/settings/keywords/new.tsx`）
  - 編集: `/settings/keywords/$ruleId`（`client/routes/settings/keywords/$ruleId.tsx`。読み込み後に対象が無ければ一覧へ戻す）
- ルールは素の fetch ラッパー（`client/lib/api/keyword-rules.ts`）+ TanStack Query。プレビュー用の番組・サービスは `$api` で取得（mirakc の OpenAPI に無い自前 API のため `$api` は使えない）。
- 「今後 7 日間」の対象番組の組み立ては `client/lib/keyword-preview.ts`（`buildUpcoming`）。
- コンポーネント:
  - `organisms/KeywordRules/RuleCard.tsx` — 有効/停止トグル・条件チップ（期間 / ChannelBadge / GenreTag）・一致件数ピル・編集・インライン削除確認
  - `organisms/KeywordRules/RuleFormModal.tsx` — 登録/編集モーダル。キーワード必須、期間（開始 > 終了はエラー）、チャンネル（放送波ごとにグループ表示）、ジャンル（ジャンル色チップ）、一致番組のライブプレビュー（先頭 5 件 + ほか N 件）。本文のみスクロールしフッターは固定（atoms/Modal は overflow を子に委ねる）
  - `templates/KeywordRules.tsx` — ツールバー（タイトル + 番組表へ + テーマ切替）、集計付きヘッダ（登録数・有効数・一致番組数）、カード一覧、空状態
