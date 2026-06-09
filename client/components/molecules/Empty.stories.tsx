import type { Meta, StoryObj } from "@storybook/react-vite";
import Empty from "./Empty.tsx";

const meta = {
  title: "molecules/Empty",
  component: Empty,
  parameters: { layout: "fullscreen" },
  args: {
    title: "BS の放送局がありません",
    description:
      "受信できる BS の放送局が見つかりませんでした。アンテナの接続や受信設定を確認してください。",
  },
} satisfies Meta<typeof Empty>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 通常表示（番組表などの広い領域向け）。 */
export const Default: Story = {};

/** コンパクト表示（視聴ページの番組選択パネルなど狭い領域向け）。 */
export const Compact: Story = {
  args: { compact: true },
};
