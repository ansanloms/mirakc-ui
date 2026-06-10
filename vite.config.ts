import { defineConfig } from "vite";
import deno from "@deno/vite-plugin";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const allowedHostsEnv = Deno.env.get("VITE_ALLOWED_HOSTS")?.trim();
const allowedHosts: true | string[] | undefined = allowedHostsEnv
  ? (allowedHostsEnv === "true" || allowedHostsEnv === "all"
    ? true
    : allowedHostsEnv.split(",").map((h) => h.trim()).filter(Boolean))
  : undefined;

// 開発時に Hono(API)を listen するポート。client/server を別プロセスで起動し、
// Vite dev server から /api/* をこのポートへプロキシする。本番は Hono 単体が
// client/dist を serveStatic しつつ同じ /api を提供するため、この proxy は dev 専用。
const apiPort = Deno.env.get("API_PORT") ?? "8000";

export default defineConfig({
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
    // deno.json の imports (npm: / jsr: / https: esm.sh) を Vite で解決する。
    // mpegts.js は webworkify-webpack の github 依存を持ち npm: では deno install
    // できないため esm.sh から取得する。その URL import の解決にこのプラグインが要る。
    deno(),
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
      // Deno は import に拡張子を要求するため、生成される routeTree.gen.ts の
      // import にも .tsx を付与する (deno check を通すため)。
      addExtensions: true,
    }),
    react(),
  ],
});
