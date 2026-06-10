import type { Meta, StoryObj } from "@storybook/react-vite";
import EventToggles from "./EventToggles.tsx";

const meta = {
  title: "organisms/Notification/EventToggles",
  component: EventToggles,
  args: {
    onStart: true,
    onEnd: true,
    onToggleStart: () => {},
    onToggleEnd: () => {},
  },
} satisfies Meta<typeof EventToggles>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 両方オフ (案内文表示)。 */
export const AllOff: Story = { args: { onStart: false, onEnd: false } };

/** 開始のみ。 */
export const StartOnly: Story = { args: { onStart: true, onEnd: false } };
