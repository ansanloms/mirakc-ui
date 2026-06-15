import type { Meta, StoryObj } from "@storybook/react-vite";
import MappingCard from "./MappingCard.tsx";
import { sampleChannelGroups } from "../../../lib/fixtures.ts";

const channel = sampleChannelGroups.find((c) => c.id === "27");

const meta = {
  title: "organisms/LiveComment/MappingCard",
  component: MappingCard,
  args: {
    mapping: {
      id: "a",
      channel: "27",
      assignments: [
        { source: "nicolive", channelId: "ch2646436" },
        { source: "nx-jikkyo", channelId: "jk1" },
      ],
      enabled: true,
      createdAt: 0,
    },
    channel,
    onToggle: () => {},
    onEdit: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof MappingCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 取得元 1 つだけ。 */
export const SingleSource: Story = {
  args: {
    mapping: {
      id: "b",
      channel: "27",
      assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
      enabled: true,
      createdAt: 0,
    },
  },
};

/** 停止中。 */
export const Disabled: Story = {
  args: {
    mapping: {
      id: "c",
      channel: "27",
      assignments: [{ source: "nicolive", channelId: "ch2646436" }],
      enabled: false,
      createdAt: 0,
    },
  },
};

/** 割り当てなし (チャンネルだけ登録)。 */
export const NoAssignments: Story = {
  args: {
    mapping: {
      id: "d",
      channel: "27",
      assignments: [],
      enabled: true,
      createdAt: 0,
    },
  },
};
