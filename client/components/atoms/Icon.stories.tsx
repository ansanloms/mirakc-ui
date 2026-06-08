import type { Meta, StoryObj } from "@storybook/react-vite";
import Icon from "./Icon.tsx";

const meta = {
  title: "atoms/Icon",
  component: Icon,
  args: { children: "live_tv", size: 32 },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Spin: Story = { args: { children: "refresh", spin: true } };

export const Gallery: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "1.6rem", color: "var(--color-text)" }}>
      {["live_tv", "search", "chevron_left", "closed_caption", "fullscreen"]
        .map(
          (name) => <Icon key={name} size={28}>{name}</Icon>,
        )}
    </div>
  ),
};
