import { defineConfig } from "vitest/config";
import svgr from "vite-plugin-svgr";

// client/ の React コンポーネントを Vite の変換パイプライン経由でテストする
// (.module.css / .svg?react を解決するため)。サーバ側ロジックは node --test
// (npm run test:server) で検証する。
//
// JSX 変換は Vitest 4 の既定トランスフォーマ（oxc）に任せる。oxc は automatic
// runtime（react/jsx-runtime）を既定で使うため追加設定は不要。@vitejs/plugin-react は
// 付けない: 本体の Vite と Vitest 内蔵の Vite はバージョンが異なり、プラグインの
// 不整合で JSX 変換が効かなくなる（"React is not defined"）ことがあるため。
export default defineConfig({
  // svgr: コンポーネントが import する `*.svg?react` をテスト時も解決する。
  // svgr は本体（Vite）の Plugin 型を返すが、vitest/config が抱える Vite は
  // バージョンが異なり型が食い違う。実行時の Plugin API は互換なので、型だけ
  // never 経由で渡して tsc の型不整合を避ける。
  plugins: [svgr() as unknown as never],
  test: {
    environment: "happy-dom",
    include: ["client/**/*.test.{ts,tsx}"],
    setupFiles: ["./client/lib/test-setup.ts"],
    css: true,
    // Player.tsx は `import("mpegts.js")` を持つ。テストでは Player に pending
    // ローダーを注入し実行はさせないため、ブラウザ API に依存する本体を読み込まない
    // ようローカルスタブへ alias する。aribb24.js は alias 不要。
    alias: {
      "mpegts.js": new URL("./client/lib/test-stubs/mpegts.ts", import.meta.url).pathname,
    },
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage/client",
      include: ["client/components/**/*.{ts,tsx}"],
      exclude: ["client/**/*.stories.tsx", "client/**/*.test.{ts,tsx}"],
    },
  },
});
