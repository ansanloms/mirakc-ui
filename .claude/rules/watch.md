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

- アクセシビリティ (クリッカブル div 等) の棚卸しは [issue #19](https://github.com/ansanloms/mirakc-ui/issues/19) で別途対応予定。

## 解消済みの制限

- 〜 aribb24.js 2.0.16: ブラウザウィンドウ拡大時に ARIB 字幕がほぼ表示されなくなる magnification バグがあった ([issue #15](https://github.com/ansanloms/mirakc-ui/issues/15))。upstream の monyone/aribb24.js 2.0.17 で修正済み。本リポジトリは 2.0.18 を使用。

## トランスコード方式

ffmpeg / tsreadex を mirakc-ui 内部で実行する A 方式で確定。代替案 (mirakc の `post-filters` に寄せる B' 方式、専用サイドカーコンテナに分離する C 方式) は [#16](https://github.com/ansanloms/mirakc-ui/issues/16) で検討の結果いずれも見送った。
