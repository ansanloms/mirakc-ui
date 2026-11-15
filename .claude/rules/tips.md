# 実装・運用の知見

## React / TanStack の hook 規約

- **render body 内で `setState` を呼ばない**。`useEffect` に寄せる。理由: React のアンチパターン。
- **リスト要素には `key` prop を必ず指定する**。`key={stableId}` を付ける。理由: 指定しないと、`Array.map()` で `<li>` 等を返すときに差分計算が狂う。
- サーバー状態は `$api.useQuery`・`$api.useMutation`（TanStack Query, `client/lib/api/client.ts`）で扱い、`{ data, isPending, isError, error }` で分岐する。自前の loading・initialized フラグは持たない。mutation 後の再取得は `queryClient.invalidateQueries({ queryKey: ["get", "/x"] })`。
- URL 状態は TanStack Router の `validateSearch` + `useNavigate` に寄せる。`history.pushState` の手書きはしない。
- 非同期初期化の stale closure 対策には `useRef` を使う。`Player.tsx` の mpegts・aribb24 初期化では `destroyed` フラグと ref で cleanup タイミングを管理する。React StrictMode の double-effect（effect が 2 回走る）に注意し、cleanup を冪等にする。

## 子プロセスの管理 (stream を Response に流す場合)

`node:child_process` の `spawn()` で子プロセスを起動し、その stdout を `new Response(...)` の body に渡す構成では、client が接続を切っても子プロセスが残る問題に注意。ffmpeg 等はバッファが埋まって stdout に書けなくなると backpressure でブロックし、プロセスがゾンビ化する。

以下 5 経路から冪等な `cleanup(reason)` を発火させる（実装は `server/routes/transcode.ts`）。

1. `c.req.raw.signal` の `abort` イベント (client 切断)
2. `childA.status` resolve (子プロセス終了。`status` は `exit` イベントから作った Promise)
3. `childB.status` resolve (もう一方の子プロセス終了)
4. 上流パイプの `.pipeTo(...).catch(...)` 経路
5. Response body を自前の `ReadableStream` でラップし `UnderlyingSource.cancel` を拾う

`cleanup` は SIGTERM を送り、3 秒後に生存していたら SIGKILL。

`stderr` は `pipe` にして必ずログに吐くこと。`ignore` だと障害解析ができない。

`spawn()` の起動失敗 (コマンドが無い等) は例外ではなく `error` イベントで届く。受け手が無いとプロセス全体が落ちるので、必ず受ける。stdin への書き込みで起きる EPIPE も同じ。

## 外部エンコーダを実 probe で検出する

`ffmpeg -encoders` の文字列一致はデバイス有無を判定できないので誤検出する (Debian の ffmpeg pkg は `h264_v4l2m2m` をビルド済み。ただし `/dev/video*` が無ければ使えない)。

対処: `ffmpeg -f lavfi -i color=... -c:v <encoder> -frames:v 10 -f null -` のような実エンコードテストを 5 秒程度の timeout 付きで走らせ、exit code で判定する。検出に失敗した結果 (`null`) はキャッシュしない。プロセス内で ffmpeg 再インストール等の復旧余地を残すためである。

## mirakc まわりの運用知見

- `/api/services/:id/stream?decode=1` は MPEG-2 Video のまま。ブラウザ (MSE・WebCodecs) では再生できないので、H.264 などへのトランスコード層を挟む必要がある。
- mirakc の `post-filters` はリクエストごとにクエリで指定するので他クライアント (EPGStation 等) に影響しない。
- tsreadex は ARIB 字幕 PES を ID3 timed-metadata に変換するツール。`aribb24.js` は mpegts.js の `TIMED_ID3_METADATA_ARRIVED` だけでなく `PES_PRIVATE_DATA_ARRIVED` 経由でも字幕を受けられるため、tsreadex 無しでも描画できる可能性がある (要実機検証)。

## Raspberry Pi 5 特有

- **H.264 HW encoder 非搭載** (BCM2712 から削除)。Pi 4 までは `h264_v4l2m2m` が使えたが、Pi 5 では encode・decode ともに CPU 処理になる。
- libx264 `-preset ultrafast -tune zerolatency` で 720p リアルタイム 1 ストリームは実用、1080p は 1〜2 ストリームが限度。
- `/dev/video*` が存在しても encoder として使えない点に注意 (Pi 4 前提の検出ロジックを使い回すと誤判定する)。

## Git 運用

- PR ブランチを main と同期するときは rebase ではなく merge commit で十分。理由: CI の synchronize が自動再走する。

## 動作確認

型チェック・lint・ユニットテストは、UI とストリームの挙動までは見ない。UI/ストリーム挙動を変えたら、ブラウザで目視すること。

1. ホスト名経由のアクセス: Raspberry Pi 等のリモート環境で開発する場合は `VITE_ALLOWED_HOSTS` env を設定した上で `http://<host>:5173/` にブラウザでアクセス。
2. ブラウザ DevTools で検証: 次のタブを観察する。
   - Console タブ: エラー・警告
   - Network タブ: API リクエストのステータス、ストリームの `Content-Type`
   - Elements タブ: `<video>`・`<canvas>`
3. サーバログの確認: devcontainer では `docker logs mirakc-ui-app-1`。tsreadex・ffmpeg・encoder-probe の stderr は `[tsreadex]`・`[ffmpeg]`・`[encoder-probe <name>]` のプレフィックス付きで出る。
4. サービスプロセスの確認: `pgrep -af 'ffmpeg|tsreadex'` でゾンビ子プロセスの有無を確認する。client 切断後も残っている場合はクリーンアップが効いていない。

## 既知の制限

- 視聴ページでは、デフォルト値（audioTrack=0・quality=`defaultQuality`・caption=true）も URL クエリに出力される。気になる場合は TanStack Router の `stripSearchParams` の導入を検討する。
- アクセシビリティ（クリッカブル div 等）の棚卸しは [issue #19](https://github.com/ansanloms/mirakc-ui/issues/19)。Modal の閉じボタンと Watch/ServiceItem は button 化、Program/Table のセルは role="button" + キーボード対応（Enter/Space）に是正済み。残りは継続課題。
