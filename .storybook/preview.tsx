import type { Preview } from "@storybook/react-vite";

// SPA と同じグローバル CSS (CSS 変数 + light-dark トークン)。
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
    layout: "fullscreen",
  },
  globalTypes: {
    theme: {
      description: "配色テーマ",
      defaultValue: "light",
      toolbar: {
        title: "テーマ",
        icon: "mirror",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      // ラッパーに color-scheme を当てると、配下の light-dark() がそのテーマで
      // 解決される。アプリ本体が documentElement に当てているのと同じ仕組み。
      const theme = (context.globals.theme as string) ?? "light";
      return (
        <div
          style={{
            // モバイル分岐は palette.css の @media が立てる --is-mobile フラグ +
            // コンテナスタイルクエリで効くため、ここでのコンテナ指定は不要。
            // (SB iframe の幅に応じて :root の @media が切り替わる。)
            colorScheme: theme,
            background: "var(--color-bg)",
            color: "var(--color-text)",
            minHeight: "100vh",
            padding: "1.6rem",
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
