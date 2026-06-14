# Deno KV が管理するデータ

mirakc-ui の設定系データ（ユーザーが UI で登録・編集する永続データ）は Deno KV
（SQLite バックエンド）に保存している。mirakc 本体が持つ EPG・録画予約とは別系統で、
この UI 固有の状態だけをここに置く。

このドキュメントは「現状で Deno KV に何が保存されているか」と「設定系データを足すときの
設計規約」を一望するためのリファレンス。コードの正本は `server/store/` と `server/lib/`
であり、齟齬が出たらコード側を正とする。

## 1. 永続化の基盤

| 項目         | 内容                                                          |
| ------------ | ------------------------------------------------------------- |
| 実体         | Deno KV（SQLite ファイル）                                    |
| ファイルパス | `${DATA_DIR:-./data}/kv.sqlite3`                              |
| ラッパー     | `server/store/kv.ts` の `Kv` クラス                           |
| 接続の共有   | `server/main.ts` で `new Kv()` を 1 つ生成し、全 store に注入 |
| テスト       | `new Kv(":memory:")` を注入してプロセス分離                   |

`DATA_DIR` は環境変数（未設定なら `./data`、gitignore 済み）。Docker 運用ではこの
ディレクトリを named volume にマウントし、コンテナ再作成をまたいで永続化する
（破棄は `docker volume rm mirakc-ui_data`）。

Deno KV は unstable API のため、`deno.json` で `unstable: ["kv"]` と
`compilerOptions.lib` の `deno.unstable` を有効にしている。

### `Kv` ラッパーの責務

`Kv`（`server/store/kv.ts`）は Deno KV の薄いラッパーで、以下を引き受ける。

- **lazy open**: 最初の操作時に `Deno.openKv()` する。SQLite の親ディレクトリが無ければ
  `Deno.mkdir(..., { recursive: true })` で作成する。
- **基本操作**: `get` / `set` / `listValues`（prefix 配下をキー順で列挙）/
  `remove`（存在時のみ削除し `boolean` を返す）/ `close`（テスト用）。

各 store（`server/store/*.ts`）は **キー設計と型の取り回し** に専念し、KV の接続・基本操作は
すべて `Kv` に委ねる。型の「定義」は Deno 非依存の純粋モジュール `server/lib/*.ts` に置き、
client とも runtime import で共有する（検証・正規化も lib 側）。

```
client ──┐                         ┌── server/routes/*.ts  (API)
         ├── server/lib/*.ts ──────┤
         │   型・検証・正規化         └── server/store/*.ts  (永続化)
         │   Deno 非依存・共有              │
         └──────────────────────────────  Kv (server/store/kv.ts)
                                                 │
                                          ${DATA_DIR}/kv.sqlite3
```

## 2. キー名前空間の一覧

KV のキーはすべて `["settings", ...]` の単一名前空間に集約する。今後の設定系データも
この名前空間に追加していく（`server/store/keyword-rules.ts` のヘッダコメント参照）。

| キー                                    | 多重度                      | 値の型（定義元）                                                | Store クラス                                                           | API ルート                   |
| --------------------------------------- | --------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------- |
| `["settings", "keyword-rules", <uuid>]` | 複数（1 ルール 1 エントリ） | `KeywordRule`（`server/lib/keyword-rules.ts`）                  | `KeywordRuleStore`（`server/store/keyword-rules.ts`）                  | `/api/keyword-rules`         |
| `["settings", "notification"]`          | 単一値                      | `NotificationSettings`（`server/lib/notification-settings.ts`） | `NotificationSettingsStore`（`server/store/notification-settings.ts`） | `/api/notification-settings` |

多重度には 2 パターンある。新しい設定系を足すときの雛形になる。

- **単一値**: 固定キー 1 つに設定オブジェクトを丸ごと保存する（notification）。
- **複数値（prefix list）**: `[prefix, <id>]` で 1 件ずつ保存し、prefix で列挙する
  （keyword-rules）。

## 3. 各データの詳細

### 3.1 キーワード自動録画ルール

- **キー**: `["settings", "keyword-rules", <uuid>]`（`id` は `crypto.randomUUID()` で採番）
- **型**: `KeywordRule`（`server/lib/keyword-rules.ts`）

| フィールド   | 型         | 意味                                                                  |
| ------------ | ---------- | --------------------------------------------------------------------- |
| `id`         | `string`   | ルール識別子（UUID）                                                  |
| `keyword`    | `string`   | 番組名への部分一致キーワード（大文字小文字無視）                      |
| `from`       | `string?`  | 期間開始日（ローカル日付 `YYYY-MM-DD`、両端含む）。未指定は無制限     |
| `to`         | `string?`  | 期間終了日（同上）                                                    |
| `serviceIds` | `number[]` | 対象サービス（Mirakurun の複合 service id）。空配列＝全チャンネル     |
| `genres`     | `number[]` | 対象ジャンル（ARIB lv1 コード 0..15）。空配列＝全ジャンル（交差判定） |
| `enabled`    | `boolean`  | 有効 / 停止。停止中は自動予約の対象外                                 |
| `createdAt`  | `number`   | 登録日時（epoch ms）                                                  |

**Store（`KeywordRuleStore`）の挙動**:

- `list()` — prefix 配下を列挙し、`isKeywordRule` 型ガードで不正値を除外した上で
  `createdAt` 降順（同値なら `id` 昇順）にソートして返す。
- `add(input, now?)` — `id`（UUID）と `createdAt` を採番して保存する。
- `update(id, input)` — 既存の `id` / `createdAt` を維持して上書きする。対象が無ければ `null`。
- `remove(id)` — 削除する（存在時 `true`、無ければ `false`）。

**正規化**: `isKeywordRule`（`server/lib/keyword-rules.ts`）が KV から読んだ値の型を
チェックし、壊れたエントリは一覧から落とす（行単位フィルタ）。入力検証は同 lib の
`parseKeywordRuleInput`（keyword の trim、期間 `from <= to`、genres は 0..15 など）。

> 関連: 自動予約ジョブ・一致判定の詳細は `.claude/rules/keyword-recording.md`。

### 3.2 ntfy 通知設定

- **キー**: `["settings", "notification"]`（単一値）
- **型**: `NotificationSettings`（`server/lib/notification-settings.ts`）

| フィールド   | 型        | 意味                                                         |
| ------------ | --------- | ------------------------------------------------------------ |
| `url`        | `string`  | トピックまで含む ntfy URL（例 `https://ntfy.sh/mirakc-rec`） |
| `token`      | `string`  | アクセストークン（任意）。`Authorization: Bearer` で送信     |
| `onSchedule` | `boolean` | 録画予約の登録（キーワード自動録画 / 手動）を通知            |
| `onStart`    | `boolean` | 録画開始（`recording.started`）を通知                        |
| `onEnd`      | `boolean` | 録画終了（`recording.stopped`）を通知                        |
| `onFail`     | `boolean` | 録画失敗（`recording.failed`）を通知                         |
| `onRemove`   | `boolean` | 録画予約の削除を通知                                         |

トグルキーの一覧と表示順は `NOTIFICATION_EVENT_KEYS`（`server/lib/notification-settings.ts`）が
単一ソース。

**Store（`NotificationSettingsStore`）の挙動**:

- `get()` — `normalizeNotificationSettings` を通し、未保存・不正値なら
  `DEFAULT_NOTIFICATION_SETTINGS`（url / token 空・全トグル `false`）を返す。常に有効な
  設定オブジェクトを返し、`null` にはしない。
- `set(settings)` — 全項目を上書きで保存する。

**正規化・マイグレーション**: `normalizeNotificationSettings`（lib）が、トグル追加前の
旧形状（`onStart` / `onEnd` しか持たない等）を、欠けたトグルの `false` 補完で吸収する
（フィールド単位の前方移行）。これにより、トグルを増やしても保存済み設定を壊さない。

> 関連: 通知送信・イベント検知の詳細は `.claude/rules/keyword-recording.md`。

## 4. 設計規約

設定系データを足すときは、以下に従う。既存 2 系統がその雛形。

1. **名前空間は `["settings", ...]` に集約する。** 固定キー（単一値）か
   `[prefix, <id>]`（複数値）かを選ぶ。
2. **3 層に分ける。**
   - `server/lib/<name>.ts` — 型・検証（`parse*Input`）・正規化（`normalize*` / 型ガード）。
     Deno API に依存させず、client とも runtime import で共有する。
   - `server/store/<name>.ts` — `Kv` を注入した永続化。キー設計に専念する。
   - `server/routes/<name>.ts` — API。store をそのまま依存させず、必要な操作だけを
     構造的な `StoreLike` 型で受け、テストでフェイクに差し替えられるようにする。
3. **読み戻し正規化は寛容に倒す。** KV は schema-less なので、保存後にスキーマが
   変わると過去の値が現スキーマと合わなくなる。読み出し時の正規化を、壊れた値で
   全体を捨てるのではなく、**可能な限り保存済みデータを守る**方針にする。既存の手本:
   - keyword-rules: `isKeywordRule` で **行単位フィルタ**（壊れた 1 件だけ落とし、残りは生かす）。
   - notification: `normalizeNotificationSettings` で **フィールド単位の前方移行**
     （欠けたトグルを `false` 補完して救う）。

   入力検証（`parse*Input`）は厳格でよいが、それを読み戻しにそのまま流用すると
   「1 件の不正で設定全体が消える」挙動になりやすい。入力は厳格・読み戻しは寛容、の
   非対称を保つ。
