# Third-Party Notices

本リポジトリが参照している第三者の成果物とそのライセンス表記。実装はいずれも参考に
とどめていますが、チャンネル ID の対応表データは同梱しています。

## tsukumi — KonomiTV / NDGRClient / NX-Jikkyo

以下はいずれも tsukumi 氏による MIT ライセンスの成果物を参考に実装、またはデータを
同梱しています。

- `server/lib/comments/sources/nicolive.ts` の NDGR (ニコ生新メッセージサーバー)
  受信フローは [NDGRClient](https://github.com/tsukumijima/NDGRClient) を参考に
  実装しました。
- `client/assets/datas/live-comment-defaults.ts` の nicolive チャンネル ID
  (実況チャンネル → ニコニコチャンネル ID の対応表 `JIKKYO_CHANNEL_ID_MAP`) は
  NDGRClient に由来します。
- `server/lib/comments/sources/nx-jikkyo.ts` の旧ニコ生コメントサーバ互換
  プロトコル (`thread` コマンド形式のハンドシェイク・`chat` メッセージ形式) は
  [NX-Jikkyo](https://github.com/tsukumijima/NX-Jikkyo) と
  [KonomiTV](https://github.com/tsukumijima/KonomiTV) の
  `LiveCommentManager.ts` を参考に実装しました。

```
MIT License

Copyright (c) 2021-2026 tsukumi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## n-air-app — nicolive-comment-protobuf

`server/lib/comments/ndgr.ts` の Protobuf フィールド番号は
[n-air-app/nicolive-comment-protobuf](https://github.com/n-air-app/nicolive-comment-protobuf)
(MIT License, Copyright (c) 2024 n-air-app) のスキーマ定義
(`proto/dwango/nicolive/chat/`) を参照しています。
