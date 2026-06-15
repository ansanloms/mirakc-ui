import type { Meta, StoryObj } from "@storybook/react-vite";
import LiveCommentSettings from "./LiveCommentSettings.tsx";
import { sampleChannelGroups } from "../../lib/fixtures.ts";

const meta = {
  title: "templates/LiveCommentSettings",
  component: LiveCommentSettings,
  parameters: { layout: "fullscreen" },
  args: {
    mappings: [
      {
        id: "a",
        channel: "27",
        assignments: [
          { source: "nicolive", channelId: "ch2646436" },
          { source: "nx-jikkyo", channelId: "jk1" },
        ],
        enabled: true,
        createdAt: 0,
      },
      {
        id: "b",
        channel: "26",
        assignments: [{ source: "nx-jikkyo", channelId: "jk2" }],
        enabled: false,
        createdAt: 0,
      },
    ],
    channels: sampleChannelGroups,
    onAdd: () => {},
    onEdit: () => {},
    onToggle: () => {},
    onRemove: () => {},
    onBackToSettings: () => {},
    onBack: () => {},
    onOpenWatch: () => {},
  },
} satisfies Meta<typeof LiveCommentSettings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 割り当てが無い空状態。 */
export const Empty: Story = {
  args: { mappings: [] },
};
