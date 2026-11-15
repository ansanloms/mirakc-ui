import { defineConfig } from "vite";
import svgr from "vite-plugin-svgr";

// Storybook 専用の最小 Vite 設定。
// プロジェクト直下の vite.config.ts は tanstackRouter プラグイン (routeTree 生成) /
// root:"client" / server.proxy を持ち、Storybook にそのまま継承させると
// ENOENT (./routes が見つからない) や root 不整合、@vitejs/plugin-react の二重登録を
// 起こす。.storybook/main.ts の builder.viteConfigPath でこのファイルを明示指定し、
// プロジェクト config の自動探索・マージを断つ。
// react プラグインは @storybook/react-vite が自前で足すためここには書かない。
export default defineConfig({
  // svgr: `*.svg?react` を React コンポーネントとして取り込む（本体の vite.config.ts と同じ）。
  plugins: [svgr()],
});
