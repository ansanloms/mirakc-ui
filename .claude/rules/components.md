# コンポーネント実装ルール

`client/components/` 配下のコンポーネントが従う規約。Storybook・ユニットテスト・スタイリングの方針を定める。

## 1. Atomic Design に則った分割

- `client/components/` は `atoms` → `molecules` → `organisms` → `templates` の 4 層で構成する。
  - **atoms**: それ以上分割できない最小 UI 部品（Button, Icon, Badge 等）。
  - **molecules**: atoms を組み合わせた小さな機能単位（番組アイテム、コメント行等）。
  - **organisms**: molecules / atoms を束ねた意味のあるブロック（番組表、プレイヤー、モーダル等）。
  - **templates**: ページ全体のレイアウト骨格。データは props で受け取り、API は持たない。
- ドメイン別のサブディレクトリ（`Program/`, `Watch/`）で層内をさらに整理してよい。
- 上位層が下位層を import するのは可。下位層が上位層を import してはならない（依存方向を一方向に保つ）。

## 2. 全コンポーネントに Storybook を用意する

- `client/components/` 配下のすべてのコンポーネントに co-located な `*.stories.tsx` を用意する。
- 最低 1 つの代表 story を持たせ、props のバリエーション（状態違い・空状態・エラー等）も story 化する。
- 共有モックは `client/lib/fixtures.ts`、router を要する story は `client/lib/storybook.tsx` の decorator を使う。
- `deno task storybook:build` が通ることを確認する。

## 3. 全コンポーネントにユニットテストを用意する

- `client/components/` 配下のすべてのコンポーネントに `*.test.ts` を用意する。
- 表示専用などテストの実益が乏しいコンポーネントについても、**空のテストファイルを必ず用意する**（網羅性を担保するため）。
- カバレッジを意識する。分岐（props による出し分け、空状態、状態バッジ等）を持つコンポーネントは、その分岐を踏むテストを書く。
- コンポーネント以外でも、ロジックを持つモジュール（`client/lib/` 等）には必要に応じてテストを追加する。

## 4. コンポーネントはテスタブルにする（外部依存を props 注入する）

- `client/components/` 配下のコンポーネントは、外部依存に相当するものをすべて props 等で注入できるようにする。
- 注入対象の例:
  - 副作用を持つライブラリ（`mpegts.js` / `aribb24.js` 等のプレイヤー実装）。
  - 時刻（`new Date()` / `Date.now()`）— 「現在時刻」は props で受け取り、テストで固定できるようにする。
  - 画面幅・メディアクエリ判定、`fetch` やストリーム供給（実況コメント等）。
  - ルーティング（`Link` 等）や翻訳（`t`）に強く依存する場合は、テスト時に差し替え可能にする。
- これにより、テストは外部モジュール（特に esm.sh の `mpegts.js` 等）を読み込まずに済み、`deno test` 単体で完結する。
- データ取得（API 呼び出し）はコンポーネントに持たせず、route 側で行って props で渡す（既存方針を踏襲）。

## 5. テストファイルは `*.test.ts` で統一する

- ユニットテストファイルの拡張子は `.test.ts` を基本とし、JSX を書きたいコンポーネントテストでは `.test.tsx` を使ってよい。
  - JSX を使うツリー描画は `.test.tsx` で素直に書く（`.ts` は JSX を解釈しないため）。
  - JSX を伴わない純ロジック（`client/lib/` 等）のテストは `.test.ts` にする。
- ランナーは用途で分ける:
  - **client（React コンポーネント）**: Vitest を `deno run -A npm:vitest`（`deno task test:client`）で実行する。`.module.css` / `?raw` / `.svg?react` / esm.sh の URL import を Vite の変換パイプラインが解決するため、素の `deno test` ではなく Vitest を用いる。DOM は happy-dom、描画は `@testing-library/react`、後片付けは `client/lib/test-setup.ts` の `afterEach(cleanup)` で行う。
  - **server（ロジック）**: 従来どおり `deno test`（`deno task test:server`）で実行する。
- `deno task test` は server → client の順で両方を走らせる。カバレッジは `deno task test:client:coverage`。
- JSX 変換は Vitest 既定のトランスフォーマ（oxc）の automatic runtime に任せる（`@vitejs/plugin-react` は Vite のバージョン不整合で使えないため付けない）。

## 6. SVG はインラインで書かずファイルに外出しする

- コンポーネント内に `<svg>` をインラインで記述しない。
- SVG は `client/assets/images/` 配下に `*.svg` として配置し、それを import して使う。
- `currentColor` やサイズ可変が必要な意匠は、import した SVG を React コンポーネントとして扱える形にする（テスト時に解決できない asset import に依存させない。詳細は実装側の設定に従う）。

## 7. CSS の絶対値サイズは rem・0.4 刻みに揃える

- CSS のサイズ指定（絶対値）は、特段の理由が無い限り `rem` を使う。
- 値は **0.4 単位** に揃える（例: `0.4rem` / `0.8rem` / `1.6rem` / `4.4rem`）。
- ただし `font-size` は、0.4 へ snap するとタイプスケールの段差が潰れて区別が消える場合がある（例: `1.3rem` と `1.1rem` がどちらも `1.2rem` になる）。その場合は段差を保てる範囲で柔軟に調整してよい（無理に同値へ潰さない）。余白・寸法系は原則どおり 0.4 へ揃える。
- 「理由がある」例外として `px` を許容する代表例:
  - 1px のボーダー・ヘアライン・区切り線など、`rem` 化すると意図がぼやける極小値。
  - メディア / コンテナクエリのブレークポイント基準値。
  - 画像・動画の実ピクセル制約に紐づく値。
- 例外で `px` を残す場合は、なぜ `rem` にしないのかが読み取れるようにする（コメント or 文脈で自明にする）。

## 8. CSS は nested で記述する

- 子セレクタ・擬似クラス・状態違いは、CSS Nesting（`&`）でネストして記述する。
- フラットに同じ接頭辞のセレクタを並べるのではなく、親ブロック配下にまとめて見通しを良くする。
- メディア / コンテナクエリも、可能なら対象セレクタの内側にネストする。

## 9. 日時は Date を使わず Temporal を使う

- 日時の整形・計算には `Date` / `@std/datetime` を使わず、グローバルの `Temporal` を使う（ポリフィルは入れず、モダンブラウザ前提）。
- 適用範囲は `client/components/` 配下と、それが使う共有 lib（`client/lib/datetime.ts` 等の時刻ユーティリティ）。`client/routes/` ・ `client/islands/` ・ URL 状態（`?d=` のタイムスタンプ等）は現状の `Date` / epoch ms を維持する。
- 「瞬間」（番組の開始/終了時刻など）の入力は mirakc API と同じく **epoch ミリ秒（number）** で受け取り、内部で `Temporal`（ローカルタイムゾーンの `ZonedDateTime`）に変換して整形・比較する。整形ロジックは共有 lib `client/lib/datetime.ts` に集約する（`formatHm` / `formatMd` / `formatMdHm` / `nowEpochMs` 等）。
- 「日（カレンダー日）」を前後させる入出力（日付ピッカー等）は、**タイムゾーンを保持する `Temporal.ZonedDateTime`** を型として使う。`Temporal.PlainDate` は使わない（TZ を落とし、Date / epoch ms との変換が曖昧になるため）。
- **曜日・月名などロケール依存の表記は `Intl`（`Temporal.*.toLocaleString({ weekday: "short" })` 等）に委ねる**。言語固有の関数（`weekdayJa` 等）や手書きの曜日配列は作らない。対応ロケールが増えても CLDR が解決する。ロケールは `client/locales/i18n.ts` の `locale` を単一ソースとして渡す。
- 「現在時刻」は `Date.now()` ではなく `nowEpochMs()`（= `Temporal.Now.instant().epochMilliseconds`）/ `nowZoned()` を使い、テスト時に固定できるよう props で注入可能にする（[[ルール 4]] と同様）。
- `Date` を触ってよいのは route 境界の変換だけ。`client/lib/datetime.ts` の `zonedFromDate` / `dateFromZoned` に閉じ込め、コンポーネント本体では `Date` を直接生成・参照しない。
- 整形に使うタイムゾーンは `client/lib/datetime.ts` のモジュール変数 1 つに集約する。既定はブラウザのローカル TZ だが、アプリ起動時に `setTimeZone()` でサーバ設定（`/api/config` の `timeZone` = server の `TZ`）へ差し替え、全ての日時表示をサーバ側に揃える（詳細は [architecture.md](./architecture.md) の「日付表示のタイムゾーン」）。コンポーネントは `formatHm` / `nowZoned` 等を呼ぶだけでよく、TZ を意識しない。テストで TZ を固定したい場合は `setTimeZone()` で設定し、後始末で元へ戻す。

## 10. 実装は TDD で進める

- 今後の実装は TDD（テスト駆動開発）で進める。
  1. **Red**: まず期待する振る舞いを表す失敗するテスト（`*.test.tsx` / `*.test.ts`）を書く。
  2. **Green**: そのテストを通す最小限の実装を書く。
  3. **Refactor**: テストが緑のままリファクタする。
- 仕様（props の出し分け・状態分岐・境界条件）はテストで先に固定してから実装する。
- 既存コードへの修正もまず失敗するテストで再現してから直す。
