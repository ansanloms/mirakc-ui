# 実況コメント

視聴画面の「実況コメント」タブに、視聴中チャンネルの実況コメントを時系列のリストで表示する ([#38](https://github.com/ansanloms/mirakc-ui/issues/38))。取得元 (ニコ生/NX-Jikkyo) は `server/lib/comments/sources/` に実装し、複数の取得元を同時に購読してまとめて表示する。取得元を足すときは、既存の取得元を手本にして `sources/` に実装し、`server/main.ts` の `createCommentsRoutes({ sources: [...] })` に並べる。

## やらないこと

- **弾幕表示 (動画上に流す表示) は実装しない**。ドワンゴのコメント表示特許 (衝突回避表示。特許第4695583号・第4734471号 = 2026/12/11 満了、第6526304号 = 2027/3/2 満了) が存続する間はリスト表示のみ。満了後に解禁を検討する。
- **実況チャンネル割り当てのデフォルトはコードに持たない**。init SQL (`server/initdb.d`) で、設定 DB が空のとき (`kv` テーブルがまだ無いとき) の起動にだけ投入する。`kv` テーブルがある DB には投入しない。
- コメント投稿は現状スコープ外 (低優先)。
- 視聴側に取得元の ON/OFF フィルタは持たない。取得元の有効/無効は設定画面 (`/settings/live-comments`) が唯一のソースで、視聴側に二重で持たない設計。

## 構成の理由

- ニコ生の NDGR View API は CORS 制限でブラウザから直結できない。そのため、コメントはサーバが受信して SSE で client へ中継する。
- Protobuf は codegen せず、ワイヤーリーダの `protobuf.ts` と、必要フィールドだけを手動でデコードする `ndgr.ts` で読む。フィールド番号の出典は n-air-app/nicolive-comment-protobuf (MIT)。
- NX-Jikkyo はニコニコ実況の後継互換サービスで、本家ニコ生に公式チャンネルが無い局 (BS 民放等) もカバーできるのが存在意義。

## ライセンス・参照の制約

- 参考実装は MIT の tsukumijima/NDGRClient・NX-Jikkyo・KonomiTV に限定する。**GPL-3.0 の n-air-app/n-air-app とライセンス無しの mujurin1/NDGRClient-ts からのコード流用は禁止**。理由: 前者は GPL 伝播、後者は all rights reserved。
- 同梱物、移植したロジック、参考にしたプロトコルの帰属表示は、`README.md` の「Third-Party Notices」に集約してある。同種の vendoring を増やしたらそこに追記する。
