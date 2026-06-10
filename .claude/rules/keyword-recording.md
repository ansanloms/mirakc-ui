# キーワード自動録画 (ルール管理) と ntfy 通知

キーワード + 任意の期間・チャンネル・ジャンルで自動録画ルールを登録・管理する機能と、録画イベント（開始・終了）の ntfy 通知。UI は Claude Design のハンドオフ（キーワード録画.html / 通知設定.html）準拠。ルールに基づく自動予約ジョブは後続 PR で追加する。

## ntfy 通知

- **設定**: `{ url, token, onStart, onEnd }`。url はトピックまで含む ntfy URL（例 `https://ntfy.sh/mirakc-rec`）。イベントが 1 つでも有効なら url 必須。型・検証 `parseNotificationSettingsInput`・`isValidNtfyUrl`・`splitNtfyUrl` は純粋共有モジュール `server/lib/notification-settings.ts`（client のフォーム検証と server で同一ロジック）。
- **永続化**: `server/lib/notification-settings-store.ts`。Deno KV のキー `["settings", "notification"]` 単一値。未保存・不正値は既定値（通知無効）にフォールバック。
- **API**: `/api/notification-settings` — GET（token も平文で返す。LAN 内個人アプリ前提）/ PUT（全上書き）/ POST `/test`（保存前の draft の url/token で実送信。失敗 502）。
- **送信**: `server/lib/ntfy.ts` の `sendNtfy({url, token}, …)`。日本語タイトルはヘッダに載らないため URL を base + topic に分解して JSON publishing（base へ POST、body に topic）。token は `Authorization: Bearer`。失敗は false（throw しない）。
- **イベント検知**: `server/lib/mirakc-events.ts` が SSE `/events` を購読（接続先は `MIRAKC_URL` から `server/lib/mirakc.ts` の `mirakcEventsUrlOf` で構築。切断時 5 秒再接続）。`recordingEventOf` が `recording.started` / `recording.stopped`（data `{programId}`）を判別し、`notifyRecordingEvent` が番組名を引いて通知する。
- **配線**: `server/main.ts`。イベントごとに KV から最新設定を読むため、保存後の反映に再起動は不要。`MIRAKC_URL` 未設定なら購読しない。
- **client**: `/settings/notification`（`templates/Notification.tsx`）。draft/dirty はテンプレート内 state（保存済み props との比較で導出）、トーストは `client/hooks/use-toast.ts`。organisms は `Notification/{ServerCard,EventToggles,SaveBar}`、トグルは共通 atom `atoms/ToggleSwitch.tsx`（RuleCard も使用）。

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

- `/settings` は設定ポータル（`templates/Settings.tsx`）。番組表ツールバーと視聴ページの歯車（light/dark の左）から遷移し、各設定画面へのナビゲーションカードを並べる。今後 `/settings/notification` のカードを追加する。
- `/settings/keywords` ルート（`client/routes/settings/keywords.tsx`、レイアウト)。設定ポータルのカードから遷移。設定系ページは `/settings/` 配下に集約する。
- 登録/編集モーダルは URL と対応する子ルートが描画し、レイアウトの `<Outlet/>`（template の `children`）として一覧の上に重なる（番組表のモーダルと同じパターン）:
  - 新規: `/settings/keywords/new`（`client/routes/settings/keywords/new.tsx`）
  - 編集: `/settings/keywords/$ruleId`（`client/routes/settings/keywords/$ruleId.tsx`。読み込み後に対象が無ければ一覧へ戻す）
- ルールは素の fetch ラッパー（`client/lib/api/keyword-rules.ts`）+ TanStack Query。プレビュー用の番組・サービスは `$api` で取得（mirakc の OpenAPI に無い自前 API のため `$api` は使えない）。
- 「今後 7 日間」の対象番組の組み立ては `client/lib/keyword-preview.ts`（`buildUpcoming`）。
- コンポーネント:
  - `organisms/KeywordRules/RuleCard.tsx` — 有効/停止トグル・条件チップ（期間 / ChannelBadge / GenreTag）・一致件数ピル・編集・インライン削除確認
  - `organisms/KeywordRules/RuleFormModal.tsx` — 登録/編集モーダル。キーワード必須、期間（開始 > 終了はエラー）、チャンネル（放送波ごとにグループ表示）、ジャンル（ジャンル色チップ）、一致番組のライブプレビュー（先頭 5 件 + ほか N 件）。本文のみスクロールしフッターは固定（atoms/Modal は overflow を子に委ねる）
  - `templates/KeywordRules.tsx` — ツールバー（タイトル + 番組表へ + テーマ切替）、集計付きヘッダ（登録数・有効数・一致番組数）、カード一覧、空状態
