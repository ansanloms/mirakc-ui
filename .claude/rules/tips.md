# 実装・運用の知見

## devcontainer の vite (app) が `deno task check/fix` で crash する

### 症状

ホスト側で `deno task check` や `deno task fix` を実行すると、しばらくして devcontainer の `app` コンテナ (vite dev server) が以下のようなエラーで停止する。

```
error: Uncaught NotFound: No such file or directory (os error 2) about
  ["/app/components/.../SomeFile.tsx.tmp.<pid>.<ts>"]
    at new FsWatcher (ext:runtime/40_fs_events.js:23:17)
    ...
```

`deno fmt` が一時ファイル (`.tmp.<pid>.<timestamp>`) を作って即 rename で削除するが、devcontainer 内の Fresh プラグイン（`@fresh/plugin-vite`）の FsWatcher が監視開始する前に元ファイルが消えて NotFound → uncaught で deno プロセス終了、という流れ。

### 対処

一時的には次で復旧する。

```sh
docker compose --project-name mirakc-ui -f .devcontainer/compose.yaml restart app
```

恒常的には以下のいずれか:

- `deno task check/fix` は devcontainer の `app` を停止した状態で実行する (ホスト側で fmt が終わってから `restart app`)
- または `check/fix` をホスト側でなく devcontainer 内部の別シェルで実行する (vite 本体とは別プロセスになり FsWatcher 競合を起こしにくい)

`.gitignore` に `*.tmp.*` を足しても Fresh 側の watcher 抑制にはならない (watcher は git 無関係)。

## Preact / Fresh の hook 規約

- **render body 内で `setState` を呼ばない** — React/Preact のアンチパターン。`useEffect` に寄せる。例: API データ到着時の初期化処理は `[data, loading]` 等に依存する `useEffect` で実行する。
- **リスト要素には `key` prop を必ず指定する** — `Array.map()` で `<section>` や `<li>` 等を返すとき、差分計算が狂う。`key={stableId}` を付ける。
- `useGet` などの非同期 hook は `{ state, data, error, loading }` のすべての状態を想定した分岐を書く。エラー時に `initialized` フラグが永久 false のまま Loading 画面から抜けられない罠を踏みやすい。
- 非同期初期化の stale closure 対策には `useRef` を使う。例えば `captionVisible` を effect 内の async 完了後に参照したい場合は `captionVisibleRef.current` パターン。

## Deno のサブプロセス管理 (stream を Response に流す場合)

`Deno.Command(...).spawn()` で子プロセスを spawn し、`child.stdout` を `new Response(...)` の body に渡す構成では、**client が接続を切っても子プロセスが残る** 問題に注意。ffmpeg 等はバッファが埋まって stdout に書けなくなると backpressure でブロックし、プロセスがゾンビ化する。

### 対処パターン

以下 5 経路から冪等な `cleanup(reason)` を発火させる。

1. `ctx.req.signal` の `abort` イベント (client 切断)
2. `childA.status` resolve (子プロセス終了)
3. `childB.status` resolve (もう一方の子プロセス終了)
4. 上流パイプの `.pipeTo(...).catch(...)` 経路
5. Response body を自前の `ReadableStream` でラップし `UnderlyingSource.cancel` を拾う

`cleanup` は SIGTERM を送り、3 秒後に生存していたら SIGKILL。

```ts
const responseBody = new ReadableStream<Uint8Array>({
  async start(controller) {
    const reader = childA.stdout.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) { controller.close(); return; }
        controller.enqueue(value);
      }
    } catch (e) { controller.error(e); }
  },
  cancel() { cleanup("response body cancel"); },
});
```

また `stderr` は `piped` にして必ずログに吐くこと。`"null"` だと障害解析ができない。改行単位で `console.error` に流すヘルパを用意するのが定石。

## Deno で外部エンコーダを実 probe 検出する

`ffmpeg -encoders` の文字列一致は**デバイス有無を判定できない**ので誤検出する (Debian の ffmpeg pkg は `h264_v4l2m2m` をビルド済み。ただし `/dev/video*` が無ければ使えない)。

対処: `ffmpeg -f lavfi -i color=... -c:v <encoder> -frames:v 10 -f null -` のような**実エンコードテスト**を 5 秒程度の timeout (`AbortController`) 付きで走らせ、exit code で判定する。

並行リクエストのレースは `let detectingPromise: Promise<...> | null` で直列化。両方失敗時は `null` を返してハンドラ側で 503 応答。`null` はキャッシュしない (プロセス内で ffmpeg 再インストール等の復旧余地を残す)。

## mirakc まわりの運用知見

- `/api/services/:id/stream?decode=1` は **MPEG-2 Video のまま**。ブラウザ (MSE / WebCodecs) では再生できないので、H.264 などへのトランスコード層を挟む必要がある。
- トランスコード層は mirakc-ui 内で実装する (A 方式) か、mirakc の `post-filters` に寄せる (B' 方式) かで設計が分かれる。`post-filters` はクエリ per-request 指定なので**他クライアント (EPGStation 等) に影響しない**。詳細は [#11](https://github.com/ansanloms/mirakc-ui/issues/11) / [#16](https://github.com/ansanloms/mirakc-ui/issues/16)。
- tsreadex は ARIB 字幕 PES を ID3 timed-metadata に変換するツール。`aribb24.js` は mpegts.js の `TIMED_ID3_METADATA_ARRIVED` だけでなく `PES_PRIVATE_DATA_ARRIVED` 経由でも字幕を受けられるため、tsreadex 無しでも描画できる可能性がある (要実機検証)。

## Raspberry Pi 5 特有

- **H.264 HW encoder 非搭載** (BCM2712 から削除)。Pi 4 までは `h264_v4l2m2m` が使えたが、Pi 5 では encode/decode ともに CPU 処理になる。
- libx264 `-preset ultrafast -tune zerolatency` で 720p リアルタイム 1 ストリームは実用、1080p は 1〜2 ストリームが限度。
- `/dev/video*` が存在しても encoder として使えない点に注意 (Pi 4 前提の検出ロジックを使い回すと誤判定する)。

## Git 運用の小ネタ

- ローカルの追跡切れブランチは `git branch -vv` で `[origin/xxx: gone]` を確認してから `git branch -D` で削除。
- 機能領域を分割して PR を起こしたい時は、`git checkout <source-branch> -- <path>` でファイル単位の取り込みが使える。cherry-pick より差分が明確。
- PR ブランチを main と同期するときは rebase ではなく merge commit で十分 (CI の synchronize が自動再走するため)。
- destructive な操作 (`git reset --hard`, `git push --force`) は明示指示が無ければ避ける。

## Claude Code Review 運用の tips

`.claude/rules/pr-review.md` 参照。
