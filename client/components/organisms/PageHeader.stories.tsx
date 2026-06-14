import type { Meta, StoryObj } from "@storybook/react-vite";
import PageHeader from "./PageHeader.tsx";
import ColorSchemeToggle from "../../islands/ColorSchemeToggle.tsx";

const meta = {
  title: "organisms/PageHeader",
  component: PageHeader,
  parameters: { layout: "fullscreen" },
  args: {
    icon: "settings",
    title: "設定",
    subtitle: "録画・通知の設定をまとめて管理",
    links: [
      { icon: "grid_view", label: "番組表へ", onClick: () => {} },
      { icon: "live_tv", label: "視聴画面を開く", onClick: () => {} },
    ],
    children: <ColorSchemeToggle />,
  },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** リンク 3 つ (設定詳細ページ相当)。 */
export const ThreeLinks: Story = {
  args: {
    icon: "notifications",
    title: "通知設定",
    subtitle: "録画イベントを ntfy.sh で通知します",
    links: [
      { icon: "grid_view", label: "番組表へ", onClick: () => {} },
      { icon: "live_tv", label: "視聴画面を開く", onClick: () => {} },
      { icon: "settings", label: "設定へ", onClick: () => {} },
    ],
  },
};
