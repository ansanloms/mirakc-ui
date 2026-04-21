# ライブ視聴とトランスコード

## ページ構成

- `/watch/[serviceId]`。`islands/Watch.tsx` がプレイヤー島、`components/organisms/Watch/` に UI 部品。

## トランスコード API

`routes/api/transcode/services/[id].ts`。パイプラインは mirakc のサービスストリーム → `tsreadex`（字幕・音声整形）→ `ffmpeg`（H.264 / AAC に再エンコード）→ MPEG-TS をチャンク応答。

## 再生

- `mpegts.js`（MSE ベース）で `<video>` にアタッチ
- `aribb24.js` で ARIB 字幕を canvas オーバーレイ

## HW エンコーダー自動検出

起動時に `h264_v4l2m2m` と `libx264` を順に**実エンコードテスト (probe)** で検証し、成功した方をキャッシュ。WSL2 等でカーネルモジュール不在の場合は `libx264` にフォールバック。両方失敗時は `503 No usable H.264 encoder found` を返す。

## デバッグログ

tsreadex / ffmpeg / encoder-probe の stderr は `[tsreadex]` / `[ffmpeg]` / `[encoder-probe ${name}]` のプレフィックス付きで `console.error` に出力する (`docker logs mirakc-ui-app-1` で確認可)。

## URL 状態管理

- `serviceId` はパスパラメータ
- `audioTrack` / `quality` / `caption` はクエリパラメータ

## 既知の制限

- ブラウザウィンドウを拡大しすぎると ARIB 字幕がほぼ表示されなくなる（aribb24.js 2.0.12 の magnification バグ、[issue #15](https://github.com/ansanloms/mirakc-ui/issues/15)）。字幕を見たい場合はウィンドウ幅を 1280px 程度に抑える。
- アクセシビリティ (クリッカブル div 等) の棚卸しは [issue #19](https://github.com/ansanloms/mirakc-ui/issues/19) で別途対応予定。

## 実装の別方針検討中

ffmpeg / tsreadex を mirakc-ui 内で実行する現状 (A 方式) に加え、mirakc の `post-filters` に変換を寄せる B' 方式を [#16](https://github.com/ansanloms/mirakc-ui/issues/16) で検討中。UI 層だけを先行して確定させる試みが [PR #18](https://github.com/ansanloms/mirakc-ui/pull/18) にある。
