import type { Meta, StoryObj } from "@storybook/react-vite";
import Niconico from "./Niconico.tsx";
import { sampleServices } from "../../lib/fixtures.ts";

const meta = {
  title: "templates/Niconico",
  component: Niconico,
  parameters: { layout: "fullscreen" },
  args: {
    channels: [
      { serviceId: sampleServices[0].id, nicoliveChannelId: "ch2646436" },
      { serviceId: sampleServices[1].id, nicoliveChannelId: "ch2646437" },
    ],
    suggestions: {
      [String(sampleServices[0].id)]: "ch2646436",
      [String(sampleServices[1].id)]: "ch2646437",
    },
    services: sampleServices,
    saving: false,
    onSave: () => Promise.resolve(),
    onBack: () => {},
  },
} satisfies Meta<typeof Niconico>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 割り当てが空 (mirakc 未接続等で既定値も無い)。 */
export const Empty: Story = {
  args: { channels: [], suggestions: {} },
};
