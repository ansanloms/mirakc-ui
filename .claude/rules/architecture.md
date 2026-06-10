# アーキテクチャ

## SPA + API サーバ構成

Fresh の Island Architecture をやめ、クライアント（Vite + React SPA）とサーバ（Hono on Deno）を物理的に分離した。

- **開発**: `deno task dev` が Hono(:8000) と Vite(:5173) を並行起動する。Vite dev server が `/api/*` を Hono へプロキシする（`vite.config.ts` の `server.proxy`）。ブラウザは :5173 のみにアクセスする。
- **本番**: Hono(:8000) が `client/dist` を `serveStatic` で配信しつつ `/api` を提供する。1 プロセス・1 イメージで watch まで完結する。

## クライアントルーティング（TanStack Router）

- `client/routes/` の file-based routing。各ルートは `createFileRoute` で定義する。
- `@tanstack/router-plugin`（Vite プラグイン）が `client/routeTree.gen.ts` を生成する。`vite.config.ts` で `addExtensions: true` を指定し、生成される import に `.tsx` を付与している（Deno は拡張子必須のため、これが無いと `deno check` が通らない）。
- URL 状態は `validateSearch` で型付き search param として定義し、`useNavigate` で更新する。番組表 `?d=<timestamp>`、検索 `?q=`、視聴 `audioTrack` / `quality` / `caption`。
- ページ遷移は `<Link>`（フルリロード回避、`defaultPreload:"intent"` でホバー時プリフェッチ）。
- watch のサービス選択は history state（`selected`）でリスト操作と直リンクを区別し、Player の autoplay unmute 判定に使う。`HistoryState` は `client/main.tsx` の `declare module` で拡張している。

## API プロキシ（Hono）

`server/routes/mirakc.ts` が mirakc バックエンドへのプロキシとして機能する。環境変数 `MIRAKC_URL`（mirakc のベース URL）から `server/lib/mirakc.ts` で API URL（`/api`）を組み立てる。`server/main.ts` で `/api/mirakc` にマウント。CORS 回避のためサーバーサイドプロキシパターンを採用。

## サーバー状態（TanStack Query）

`client/lib/api/client.ts` の `$api`（openapi-react-query）を使う。

- `$api.useQuery("get", "/services")` → `{ data, isPending, isError, error }`
- `$api.useMutation("post", "/recording/schedules")` → `{ mutate, mutateAsync, isPending }`
- mutation 後の再取得は `queryClient.invalidateQueries({ queryKey: ["get", "/x"] })`（openapi-react-query の queryKey は `[method, path]` の前方一致）。

`openapi-fetch` と生成された `schema.d.ts` により完全な型安全性を実現。旧 `hooks/api` の自前 state マシン（before/pending/fulfilled/rejected）は廃止した。

## スタイリング

- `client/assets/styles/palette.css` — CSS 変数によるカラートークン。`light-dark()` 関数でテーマ切り替え。ジャンル別カラー（16色）定義。
- コンポーネントスコープは `.module.css` で管理。
- SPA 化により全 CSS が main エントリに普通にバンドルされる。旧 Fresh 構成の island への CSS 強制注入 hack（`force-inject-all-css`）は不要になり**廃止した**。

## コンポーネント

`client/components/` は Atomic Design 構成（atoms → molecules → organisms → templates）。データは props で受け取る純粋な表示層で、API 呼び出しは持たない（呼び出しは route 側）。

## 国際化

`client/locales/ja-JP/` にスコープ別翻訳ファイル（common, program, recording, search, watch）。SPA 化により SSR 時の `getFixedT` 問題は消えた。
