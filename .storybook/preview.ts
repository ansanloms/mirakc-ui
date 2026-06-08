import type { Preview } from "@storybook/react-vite";

// SPA 本体 (client/main.tsx) と同じグローバル CSS を読み込み、CSS 変数による
// カラートークン / ライト・ダーク切り替え / レイアウトを story にも効かせる。
import "../client/assets/styles/palette.css";
import "../client/assets/styles/general.css";
import "../client/assets/styles/layout.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
