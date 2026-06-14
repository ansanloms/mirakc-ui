# mirakc-ui internal API

mirakc-ui のアプリサーバ (Hono) が提供する内部 API である。mirakc のプロキシとは別に、mirakc-ui 自身が永続化する設定系データを扱う。

- キーワード自動録画ルールの CRUD。
- ntfy への録画イベント通知の設定とテスト送信。

LAN 内の個人用アプリを前提とするため認証は設けない。mirakc 由来の API は mirakc 自身の OpenAPI で管理し、この文書には含めない。
