# 実況コメント

視聴画面の右パネル「実況コメント」タブに、視聴中チャンネルの実況コメントを時系列リスト表示する ([#38](https://github.com/ansanloms/mirakc-ui/issues/38))。コメント取得元 (ニコ生 / NX-Jikkyo) はプラッガブルで、複数を同時購読し、視聴側の取得元フィルタで表示を切り替える。

**弾幕表示 (動画上に流す表示) は実装しない**。ドワンゴのコメント表示特許 (衝突回避表示。特許第4695583号・第4734471号 = 2026/12/11 満了、第6526304号 = 2027/3/2 満了) が存続する間はリスト表示のみ。満了後に解禁を検討する。コメント投稿も現状スコープ外 (低優先)。

## アーキテクチャ

```
CommentSource (server/lib/comments/sources/*)   ← 複数を束ねる
  → SSE 中継 (server/routes/comments.ts, GET /api/comments/services/:id/stream)
  → client/hooks/use-live-comments.ts (EventSource)
  → organisms/Watch/LiveCommentTab・Player のオーバーレイ (表示)
```

- **正規化型と source インターフェイス**: `server/lib/comments/types.ts` (純粋共有モジュール)。`SourceComment { id, source, at, text, author? }` を SSE で client へ流す。ソースは `CommentSource.subscribe(target, { signal })` を実装する — 対応しないチャンネルなら **null を返す** (設定参照が要る場合は Promise でも可)。エラー時の再接続はソース側の責務。
- **SSE イベント**: `sources` (購読できた取得元 ID 配列。接続直後に 1 回。**空配列 = 実況非対応**で client は EventSource を閉じる) / `comment` (SourceComment の JSON) / `ping` (keep-alive 30 秒)。
- **SSE 接続ごとに全取得元を購読する**。同一サービス複数視聴での上流共有 (多重化) は将来課題。
- ソースの追加は `sources/` に実装を足して `server/main.ts` の `createCommentsRoutes({ sources: [...] })` に並べる。予定: Bluesky・チャンネル毎の固定ハッシュタグ。

## 取得元 (CommentSource)

### ニコ生 (NDGR) — `sources/nicolive.ts`

本家ニコニコ実況 (ニコ生公式チャンネル) から**未ログイン**で受信する。

1. `https://live.nicovideo.jp/watch/{ch}` の `#embedded-data` (data-props JSON) から視聴セッション WS URL と放送状態を取得 (ch ID を watch URL に渡すと放送中番組へ解決される)
2. 視聴セッション WS で `startWatching` → `messageServer` から **NDGR View API の URI** を取得し即切断
3. `GET {viewUri}?at=now` の HTTP chunked + **length-delimited Protobuf** ストリームを読み、segment エントリの Segment API を並行受信 → chat をコメントとして流す。`next` カーソルで View へ再接続し続ける

- View API は CORS 制限でブラウザ直結不可 → サーバ中継が必須 (この構成の理由)。
- Protobuf は codegen せず、`protobuf.ts` (ワイヤーリーダ) + `ndgr.ts` (必要フィールドだけ手動デコード) で読む。フィールド番号の出典は n-air-app/nicolive-comment-protobuf (MIT)。
- 障害時は 10 秒待ちで再接続、放送休止中 (ON_AIR 以外) は 60 秒間隔で再確認、無通信 90 秒で張り替え。

### NX-Jikkyo — `sources/nx-jikkyo.ts`

NX-Jikkyo (ニコニコ実況の後継互換サービス) から受信する。本家ニコ生に公式チャンネルが無い局 (BS 民放等) もカバーできるのが存在意義。

- `wss://nx-jikkyo.tsukumijima.net/api/v1/channels/{jk}/ws/comment` に**直結**し、open 時に旧ニコ生コメントサーバ形式の `thread` コマンド (`version:"20061206"`, `thread:""` で現在スレッド自動接続, `res_from` 負値で直近 N 件 + 以降リアルタイム) を送るだけ。視聴セッション・threadkey 不要、未ログイン可、keep-alive 不要 (本家 NDGR より単純)。
- `chat` メッセージを正規化: `at = date*1000 + floor(date_usec/1000)`、`id = "{thread}:{no}"` (no 単独はスレッド跨ぎで衝突)。匿名ハッシュ user_id は表示名にならないため author は出さない。
- 障害時は 10 秒待ちで再接続。

## チャンネル解決と設定 (`/settings/live-comments`)

- 設定画面で取得元ごとに「mirakc サービス → 実況チャンネル ID」を割り当てる。ID 形式は取得元別 (ニコ生=`ch2646436` / NX-Jikkyo=`jk1`)。**各行に有効/無効スイッチ** (無効行は薄く表示・保存はされるが解決と検証の対象外)。
- 保存先は Deno KV `["settings", "live-comment"]` (`server/store/live-comment-settings.ts`、汎用 `singletonStore` を使う。未保存・不正値は `null` を返し呼び出し側が組み込み対照表へフォールバックする)。API は `server/routes/live-comment-settings.ts` の GET/PUT `/api/live-comment-settings`。GET は未保存時に組み込み対照表からの既定値 + 自動補完候補 (`suggestions`) を返す。
- 型・I/F は内部 API の単一ソース方針に従い `docs/api` の OpenAPI から組み立てる (`ChannelMapping` / `LiveCommentSettings` / `LiveCommentSettingsView` の component schema、`/live-comment-settings` パス)。型は `FromSchema`、構造検証は生成スキーマ + `@cfworker/json-schema`。SSE 中継は `/comments/services/{id}/stream` として記述する。
- 各ソースは `resolveChannelId` を注入され、**購読のたびに KV を読む** (保存後の反映に再起動不要)。設定が未保存なら組み込み対照表 (`jikkyo.ts`) にフォールバック (ニコ生=`nicoliveChannelIdOf`→ch ID / NX-Jikkyo=`jikkyoIdOf`→jk ID)。無効行 (enabled:false) は解決しない。
- `jikkyo.ts`: NID/SID → jk ID (KonomiTV の jikkyo-channels.json、地上波は SID のみ照合 + サブチャンネルは SID-1/-2 フォールバック) → ニコニコチャンネル ID (本家に無い jk は null)。
- 検証は二層。構造 (型・必須・配列要素) は docs/api 由来の生成スキーマ + `@cfworker/json-schema`。OpenAPI に表現できない相関検証 (チャンネル ID の形式・serviceId / チャンネル ID の重複) は純粋共有 `server/lib/live-comment-settings.ts`。**有効行のみ厳密検証**し、serviceId 重複だけ有効・無効問わず禁止。client のフォームと server の PUT が同一ロジックを使う。

## 視聴のソース選択

- SSE の `sources` イベント = サーバが購読できた取得元。`use-live-comments` がこれを候補にし、**フィルタチップ (複数選択、localStorage 永続化)** で表示を絞る。再接続で sources が再送されても選択はリセットしない。
- 候補が複数あるとき各コメントに**取得元バッジ** (色・タグは `client/lib/comment-source.ts`、色は code・ラベル/タグは locales `liveComment.source.*`)。
- 全解除すると「取得元が選択されていません」案内。フィルタチップ・空状態は `organisms/Watch/SourceFilter`・`LiveCommentTab`。プレイヤーの映像上オーバーレイ (`Player` → `CommentFeed onVideo`) にもバッジは出るがフィルタ操作は実況タブのみ。

## ライセンス・参照の制約

- 参考実装は MIT の tsukumijima/NDGRClient・NX-Jikkyo・KonomiTV に限定する。**GPL-3.0 の n-air-app/n-air-app とライセンス無しの mujurin1/NDGRClient-ts からのコード流用は禁止** (前者は GPL 伝播、後者は all rights reserved)。
- 同梱物 (jikkyo-channels.json、移植ロジック、スキーマ参照、プロトコル参考) の帰属表示は `THIRD_PARTY_NOTICES.md` に集約してある。同種の vendoring を増やしたらここに追記する。
