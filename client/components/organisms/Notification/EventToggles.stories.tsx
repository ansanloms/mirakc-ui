import type { Meta, StoryObj } from "@storybook/react-vite";
import EventToggles from "./EventToggles.tsx";

const meta = {
  title: "organisms/Notification/EventToggles",
  component: EventToggles,
  args: {
    values: {
      onSchedule: true,
      onStart: true,
      onEnd: true,
      onFail: true,
      onRemove: false,
    },
    onToggle: () => {},
  },
} satisfies Meta<typeof EventToggles>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** すべてオフ (案内文表示)。 */
export const AllOff: Story = {
  args: {
    values: {
      onSchedule: false,
      onStart: false,
      onEnd: false,
      onFail: false,
      onRemove: false,
    },
  },
};
