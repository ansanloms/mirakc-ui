import type { Meta, StoryObj } from "@storybook/react-vite";
import LiveCommentSettings from "./LiveCommentSettings.tsx";
import { sampleServices } from "../../lib/fixtures.ts";

const meta = {
  title: "templates/LiveCommentSettings",
  component: LiveCommentSettings,
  parameters: { layout: "fullscreen" },
  args: {
    channels: {
      nicolive: [
        {
          serviceId: sampleServices[0].id,
          channelId: "ch2646436",
          enabled: true,
        },
        {
          serviceId: sampleServices[1].id,
          channelId: "ch2646437",
          enabled: false,
        },
      ],
      "nx-jikkyo": [
        {
          serviceId: sampleServices[0].id,
          channelId: "jk1",
          enabled: true,
        },
      ],
    },
    suggestions: {
      nicolive: {
        [String(sampleServices[0].id)]: "ch2646436",
        [String(sampleServices[1].id)]: "ch2646437",
      },
      "nx-jikkyo": {
        [String(sampleServices[0].id)]: "jk1",
        [String(sampleServices[1].id)]: "jk2",
      },
    },
    services: sampleServices,
    saving: false,
    onSave: () => Promise.resolve(),
    onBack: () => {},
  },
} satisfies Meta<typeof LiveCommentSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 割り当てが空 (mirakc 未接続等で既定値も無い)。 */
export const Empty: Story = {
  args: {
    channels: { nicolive: [], "nx-jikkyo": [] },
    suggestions: { nicolive: {}, "nx-jikkyo": {} },
  },
};
