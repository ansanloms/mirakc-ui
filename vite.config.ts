import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { apiPortOf } from "./server/lib/api-port.ts";

export default defineConfig(({ mode }) => {
  // 設定自体が .env の値 (API_PORT など) に依存するため loadEnv で読む。Vite は
  // 設定の評価中には .env を process.env へ入れない。環境変数が優先される。
  const env = loadEnv(mode, process.cwd(), "");

  const allowedHostsEnv = env.VITE_ALLOWED_HOSTS?.trim();
  const allowedHosts: true | string[] | undefined = allowedHostsEnv
    ? (allowedHostsEnv === "true" || allowedHostsEnv === "all"
      ? true
      : allowedHostsEnv.split(",").map((h) => h.trim()).filter(Boolean))
    : undefined;

  // 開発時に Hono(API)を listen するポート。client/server を別プロセスで起動し、
  // Vite dev server から /api/* をこのポートへプロキシする。本番は Hono 単体が
  // client/dist を serveStatic しつつ同じ /api を提供するため、この proxy は dev 専用。
  // 不正値は server/main.ts と同じく 8000 に落とす (apiPortOf)。
  const apiPort = apiPortOf(env.API_PORT);

  return {
    root: "client",
    // SPA の多階層ルート (/watch/$serviceId 等) でも asset を解決できるよう絶対パス
    // にする。"./" (相対) だと 2 階層パスから ./assets が /watch/assets に解決され
    // 404 -> SPA フォールバックの index.html (text/html) を JS として読み MIME エラーになる。
    base: "/",
    // 依存最適化キャッシュを root(client) 直下ではなくルートの node_modules 配下に
    // 逃がす。client/ は devcontainer で bind mount されており、root(client) 直下だと
    // コンテナ(root)生成の .vite がホスト(非 root)の vite と衝突して EACCES で落ちる。
    // node_modules は devcontainer では named volume なのでコンテナ/ホストで分離される。
    cacheDir: "../node_modules/.vite",
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      // devcontainer / リモートホスト経由のアクセスを許可する (旧 compose の
      // --host 0.0.0.0 相当)。
      host: true,
      allowedHosts,
      proxy: {
        "/api": {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
    plugins: [
      // svgr: `*.svg?react` を React コンポーネントとして取り込む。インライン SVG を
      // 禁止し assets/images へ外出しするため、currentColor 追従が要る意匠で使う。
      svgr(),
      // tanstackRouter は react() より前に置く必要がある。
      // root を "client" にしているため、各パスは root(client) 基準で解決される。
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./routes",
        generatedRouteTree: "./routeTree.gen.ts",
        // 生成される routeTree.gen.ts の import に .tsx を付与する。tsconfig の
        // allowImportingTsExtensions と揃え、拡張子付きの import で統一するため。
        addExtensions: true,
      }),
      react(),
    ],
  };
});
