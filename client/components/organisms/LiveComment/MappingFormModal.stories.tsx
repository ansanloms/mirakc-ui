import type { Meta, StoryObj } from "@storybook/react-vite";
import MappingFormModal from "./MappingFormModal.tsx";
import type { LiveCommentSuggestion } from "../../../lib/api/live-comment-settings.ts";
import { sampleChannelGroups } from "../../../lib/fixtures.ts";

const suggestions: LiveCommentSuggestion[] = [
  {
    channel: "27",
    assignments: [
      { source: "nicolive", channelId: "ch2646436" },
      { source: "nx-jikkyo", channelId: "jk1" },
    ],
  },
  {
    channel: "26",
    assignments: [
      { source: "nicolive", channelId: "ch2646437" },
      { source: "nx-jikkyo", channelId: "jk2" },
    ],
  },
];

const meta = {
  title: "organisms/LiveComment/MappingFormModal",
  component: MappingFormModal,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    channels: sampleChannelGroups,
    suggestions,
    takenChannels: [],
    onSave: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof MappingFormModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 新規登録。 */
export const New: Story = {};

/** 一部チャンネルが設定済み (選択不可)。 */
export const SomeTaken: Story = {
  args: { takenChannels: ["26", "25"] },
};

/** 既存割り当ての編集。 */
export const Edit: Story = {
  args: {
    initial: {
      id: "a",
      channel: "27",
      assignments: [
        { source: "nicolive", channelId: "ch2646436" },
        { source: "nx-jikkyo", channelId: "jk1" },
      ],
      enabled: true,
      createdAt: 0,
    },
  },
};

/** 保存処理中。 */
export const Busy: Story = {
  args: {
    busy: true,
    initial: {
      id: "a",
      channel: "27",
      assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
      enabled: true,
      createdAt: 0,
    },
  },
};
