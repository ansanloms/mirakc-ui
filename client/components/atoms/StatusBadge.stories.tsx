import type { Meta, StoryObj } from "@storybook/react-vite";
import StatusBadge from "./StatusBadge.tsx";

const meta = {
  title: "atoms/StatusBadge",
  component: StatusBadge,
  args: { kind: "live" },
} satisfies Meta<typeof StatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Live: Story = { args: { kind: "live" } };
export const New: Story = { args: { kind: "new" } };
export const Reserved: Story = { args: { kind: "reserved" } };
export const Recorded: Story = { args: { kind: "recorded" } };

export const All: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.8rem" }}>
      <StatusBadge kind="live" />
      <StatusBadge kind="new" />
      <StatusBadge kind="reserved" />
      <StatusBadge kind="recorded" />
    </div>
  ),
};
