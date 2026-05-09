# プロジェクト概要

[mirakc](https://github.com/mirakc/mirakc) 向けの Web UI。番組表閲覧、録画管理、番組検索機能を提供する。ライブ視聴機能は UI 骨組みが先行で入っており、トランスコード層は [issue #11 (A 方式)](https://github.com/ansanloms/mirakc-ui/issues/11) / [issue #16 (B' 方式)](https://github.com/ansanloms/mirakc-ui/issues/16) で別途検討中。

## テックスタック

- **フレームワーク**: Fresh 2.x（Deno ベース）
- **UI**: Preact + @preact/signals
- **ビルド**: Vite（`vite.config.ts` に CSS 強制注入カスタムプラグインあり）
- **ランタイム**: Deno 2.x
- **API クライアント**: openapi-fetch + openapi-typescript による型安全な API 呼び出し
- **国際化**: i18next（日本語のみ）
- **スタイリング**: CSS モジュール + グローバル CSS 変数（ライト/ダークモード対応）

## コマンド

```bash
deno task dev        # 開発サーバー起動（vite、ポート 5173）
deno task build      # 本番ビルド（_fresh/ に出力）
deno task start      # ビルド済みアプリを起動（deno serve）
deno task check      # fmt チェック + lint + 型チェック（CI 相当）
deno task fix        # deno lint --fix + deno fmt で自動修正
deno task generate   # OpenAPI スキーマから hooks/api/schema.d.ts を再生成
```

lint プラグインとして `@aireone/deno-lint-curly` を使用しており、1 行の `if` でも波括弧が必須。`deno task check` が失敗したら `deno task fix` で多くは解消する。
