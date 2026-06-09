import type { Meta, StoryObj } from "@storybook/react-vite";
import Kbd from "./Kbd.tsx";

const meta = {
  title: "atoms/Kbd",
  component: Kbd,
  args: { children: "Ctrl+K" },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mac: Story = { args: { children: "⌘K" } };

export const SingleKey: Story = { args: { children: "Esc" } };
