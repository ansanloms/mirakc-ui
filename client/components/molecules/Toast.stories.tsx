import type { Meta, StoryObj } from "@storybook/react-vite";
import Toast from "./Toast.tsx";

const meta = {
  title: "molecules/Toast",
  component: Toast,
  parameters: { layout: "fullscreen" },
  args: {
    message: "通知設定を保存しました",
    variant: "success",
  },
} satisfies Meta<typeof Toast>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Success: Story = {};

export const Error: Story = {
  args: { message: "テスト通知の送信に失敗しました", variant: "error" },
};
