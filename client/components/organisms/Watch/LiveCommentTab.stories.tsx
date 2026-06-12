import type { Meta, StoryObj } from "@storybook/react-vite";
import LiveCommentTab from "./LiveCommentTab.tsx";
import { sampleLiveComments } from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/Watch/LiveCommentTab",
  component: LiveCommentTab,
  args: {
    comments: sampleLiveComments,
    connected: true,
    onPost: () => {},
  },
  decorators: [
    (Story) => (
      <div
        style={{ height: "40rem", display: "flex", flexDirection: "column" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LiveCommentTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Connected: Story = {};

export const Disconnected: Story = {
  args: {
    comments: [],
    connected: false,
  },
};

/** 投稿未対応 (onPost 無し) では入力欄が出ない受信専用表示。 */
export const ReadOnly: Story = {
  args: {
    onPost: undefined,
  },
};
