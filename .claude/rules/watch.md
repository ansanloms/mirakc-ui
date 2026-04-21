# ライブ視聴

## ページ構成

- `/watch` — サービス一覧
- `/watch/[serviceId]` — プレイヤー
- `islands/Watch.tsx` がプレイヤー島、`components/organisms/Watch/` に UI 部品

## ストリーム

現状は `/api/mirakc/services/:id/stream?decode=1`（mirakc 生ストリーム、MPEG-2 Video）を直接プロキシするのみ。ブラウザ（MSE）では映像は再生できない。Player 上部に「視聴機能は別 PR で実装予定」の告知を表示する。トランスコード層は [#11 (A 方式)](https://github.com/ansanloms/mirakc-ui/issues/11) または [#16 (B' 方式)](https://github.com/ansanloms/mirakc-ui/issues/16) で別途実装する想定。

## 再生ライブラリ

- `mpegts.js`（MSE）で `<video>` にアタッチ
- `aribb24.js` で ARIB 字幕を canvas オーバーレイ
- 映像トランスコードが未配線でも、字幕 PES が含まれていれば aribb24.js 経由で canvas に描画される場合がある (mpegts.js の `PES_PRIVATE_DATA_ARRIVED` → `feedB24`)

## URL 状態管理

- `serviceId` はパスパラメータ
- `audioTrack` / `quality` / `caption` はクエリパラメータ
- トランスコード層が入ると `audioTrack` / `quality` が `streamUrl` に反映される（現状は UI 上の state のみ、ボタンは disabled 固定）

## サービス一覧

物理チャンネル (`channel.type` + `channel.channel`) + サービス名の組で重複排除する（mirakc は 1 物理チャンネルに主サービス / 副サービス / 1 セグ等を別 serviceId として返すため）。

## 既知の制限

- ブラウザウィンドウを拡大しすぎると ARIB 字幕がほぼ表示されなくなる（aribb24.js 2.0.12 の magnification バグ、[issue #15](https://github.com/ansanloms/mirakc-ui/issues/15)）。字幕を見たい場合はウィンドウ幅を 1280px 程度に抑える。
- アクセシビリティ（クリッカブル div 等）の棚卸しは [issue #19](https://github.com/ansanloms/mirakc-ui/issues/19) で別途対応予定。
