# 実況コメント

視聴画面の右パネル「実況コメント」タブに、視聴中チャンネルの実況コメントを時系列リスト表示する ([#38](https://github.com/ansanloms/mirakc-ui/issues/38))。

**弾幕表示 (動画上に流す表示) は実装しない**。ドワンゴのコメント表示特許 (衝突回避表示。特許第4695583号・第4734471号 = 2026/12/11 満了、第6526304号 = 2027/3/2 満了) が存続する間はリスト表示のみ。満了後に解禁を検討する。コメント投稿も現状スコープ外 (低優先)。

## アーキテクチャ

```
CommentSource (server/lib/comments/sources/*)
  → SSE 中継 (server/routes/comments.ts, GET /api/comments/services/:id/stream)
  → client/hooks/use-live-comments.ts (EventSource)
  → organisms/Watch/LiveCommentTab (表示)
```

- **正規化型と source インターフェイス**: `server/lib/comments/types.ts` (純粋共有モジュール)。`SourceComment { id, source, at, text, author? }` を SSE で client へ流す。ソースは `CommentSource.subscribe(target, { signal })` を実装する — 対応しないチャンネルなら **null を返す** (同期判定)。エラー時の再接続はソース側の責務。
- **SSE イベント**: `sources` (対応ソース ID 配列。接続直後に 1 回。**空配列 = 実況非対応**で client は EventSource を閉じる) / `comment` (SourceComment の JSON) / `ping` (keep-alive 30 秒)。
- **SSE 接続ごとに上流を購読する**。同一サービス複数視聴での上流共有 (多重化) は将来課題。
- ソースの追加は `sources/` に実装を足して `server/main.ts` の `createCommentsRoutes({ sources: [...] })` に並べる。予定: NX-Jikkyo (PR2)、Bluesky・チャンネル毎の固定ハッシュタグ (PR3)。

## ニコ生 (NDGR) ソース

`server/lib/comments/sources/nicolive.ts`。本家ニコニコ実況 (ニコ生公式チャンネル) から**未ログイン**で受信する。

1. `https://live.nicovideo.jp/watch/{ch}` の `#embedded-data` (data-props JSON) から視聴セッション WS URL と放送状態を取得 (ch ID を watch URL に渡すと放送中番組へ解決される)
2. 視聴セッション WS で `startWatching` → `messageServer` から **NDGR View API の URI** を取得し即切断
3. `GET {viewUri}?at=now` の HTTP chunked + **length-delimited Protobuf** ストリームを読み、segment エントリの Segment API を並行受信 → chat をコメントとして流す。`next` カーソルで View へ再接続し続ける

- View API は CORS 制限でブラウザ直結不可 → サーバ中継が必須 (この構成の理由)。
- Protobuf は codegen せず、`protobuf.ts` (ワイヤーリーダ) + `ndgr.ts` (必要フィールドだけ手動デコード) で読む。フィールド番号の出典は n-air-app/nicolive-comment-protobuf (MIT)。
- チャンネル解決は**設定優先**: `/settings/niconico` (ニコニコ実況連携) でチャンネル → ニコニコチャンネル ID を割り当てる。保存先は Deno KV `["settings", "niconico"]` (`server/store/niconico-settings.ts`、API は `server/routes/niconico-settings.ts` の GET/PUT `/api/niconico-settings`)。nicolive ソースは `resolveChannelId` を注入され、**購読のたびに KV を読む**ため保存後の反映に再起動不要。**未保存なら組み込み対照表にフォールバック**する。
- 組み込み対照表は `jikkyo.ts`: NID/SID → jk ID (KonomiTV の jikkyo-channels.json、地上波は SID のみ照合 + サブチャンネルは SID-1/-2 フォールバック) → ニコニコチャンネル ID (本家に無い jk は null)。設定画面の既定値・自動補完候補 (GET の `suggestions`) もここから導出する。
- 検証 (`ch数字` 形式・serviceId / ch ID の重複禁止) は純粋共有モジュール `server/lib/niconico-settings.ts` に置き、client のフォームと server の PUT が同一ロジックを使う。
- 障害時は 10 秒待ちで再接続、放送休止中 (ON_AIR 以外) は 60 秒間隔で再確認、無通信 90 秒で張り替え。**非公式利用のため壊れても視聴機能本体に影響させない** (ログを吐いて再試行のみ)。

## ライセンス・参照の制約

- 参考実装は MIT の tsukumijima/NDGRClient・NX-Jikkyo・KonomiTV に限定する。**GPL-3.0 の n-air-app/n-air-app とライセンス無しの mujurin1/NDGRClient-ts からのコード流用は禁止** (前者は GPL 伝播、後者は all rights reserved)。
- 同梱物 (jikkyo-channels.json、移植ロジック、スキーマ参照) の帰属表示は `THIRD_PARTY_NOTICES.md` に集約してある。同種の vendoring を増やしたらここに追記する。
