import type { Meta, StoryObj } from "@storybook/react-vite";
import RecordingStatusBadge from "./RecordingStatusBadge.tsx";

const meta = {
  title: "atoms/RecordingStatusBadge",
  component: RecordingStatusBadge,
  args: { state: "scheduled" },
} satisfies Meta<typeof RecordingStatusBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Scheduled: Story = { args: { state: "scheduled" } };
export const Tracking: Story = { args: { state: "tracking" } };
export const Recording: Story = { args: { state: "recording" } };
export const Rescheduling: Story = { args: { state: "rescheduling" } };
export const Finished: Story = { args: { state: "finished" } };
export const Failed: Story = { args: { state: "failed" } };

export const All: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
      {(
        [
          "scheduled",
          "tracking",
          "recording",
          "rescheduling",
          "finished",
          "failed",
        ] as const
      ).map((s) => <RecordingStatusBadge key={s} state={s} />)}
    </div>
  ),
};
