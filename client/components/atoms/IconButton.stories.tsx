import type { Meta, StoryObj } from "@storybook/react-vite";
import IconButton from "./IconButton.tsx";

const meta = {
  title: "atoms/IconButton",
  component: IconButton,
  args: { icon: "chevron_left", label: "前の日" },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Theme: Story = {
  args: { icon: "dark_mode", label: "テーマ切替" },
};
