import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: {
      builder: {
        // プロジェクト直下の vite.config.ts を自動マージさせず、Storybook 専用の
        // 最小設定 (.storybook/vite.config.ts) だけをロードする。これが無いと
        // builder-vite が vite.config.ts を loadConfigFromFile で読み、tanstackRouter
        // の routeTree 生成が ./routes を読みに行って ENOENT になる。
        viteConfigPath: ".storybook/vite.config.ts",
      },
    },
  },
  stories: ["../client/**/*.stories.@(ts|tsx)"],
  addons: [],
};

export default config;
