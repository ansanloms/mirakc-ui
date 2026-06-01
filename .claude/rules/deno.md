# Deno 設定の注意点

- `nodeModulesDir: "manual"` — Vite / esbuild が実ディレクトリの node_modules からの解決を要求するため。依存を追加したら `deno install` で node_modules を作る。`"auto"` は使わない方針。未指定（グローバルキャッシュ）だと Vite 自体が起動できない（`Could not find referrer npm package` で落ちる）。
- `jsx: "react-jsx"` / `jsxImportSource: "react"`。React 19 を npm: で導入。Vite プラグインは `@vitejs/plugin-react`。
- **生成物の扱い**: `client/routeTree.gen.ts` と `client/lib/api/schema.d.ts` は fmt / lint からは除外するが、`deno check`（型チェック）には**含める**。前者の `declare module` による TanStack Router の Register 拡張、後者の `paths` 型が型解決に必須なため。トップレベル `exclude` ではなく `fmt.exclude` / `lint.exclude` に置くことで両立させている。
- **TanStack Router の生成 import**: `vite.config.ts` の `tanstackRouter({ addExtensions: true })` で `routeTree.gen.ts` の import に `.tsx` を付与する。Deno は拡張子必須のため、これが無いと `deno check` が `Cannot find module` で落ちる。`client/main.tsx` の `routeTree.gen.ts` import も拡張子付きにする。
- **mpegts.js / aribb24.js**: `mpegts.js` は webworkify-webpack（github: 依存）を持つため npm: では `deno install` できない。esm.sh（`https://esm.sh/mpegts.js@1.8.0`）から取得し、その URL import を Vite で解決するため `@deno/vite-plugin` を導入している。`aribb24.js` は npm: `2.0.19`。
- Deno のバージョンは Dockerfile の `FROM docker.io/denoland/deno:<version>` と `.devcontainer/onCreateCommand.sh` の `v<version>` 指定を揃える。上げる際は両方同時に更新する。
