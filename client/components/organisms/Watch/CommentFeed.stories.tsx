import type { Meta, StoryObj } from "@storybook/react-vite";
import CommentFeed from "./CommentFeed.tsx";
import { sampleLiveComments } from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/Watch/CommentFeed",
  component: CommentFeed,
  args: {
    comments: sampleLiveComments,
  },
  decorators: [
    (Story) => (
      <div
        style={{ height: "32rem", display: "flex", flexDirection: "column" }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CommentFeed>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 映像上のオーバーレイ表示 (白文字 + 影)。プレイヤーから使う。 */
export const OnVideo: Story = {
  args: {
    onVideo: true,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          height: "32rem",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(to right, #334, rgba(3, 5, 9, 0.72))",
        }}
      >
        <Story />
      </div>
    ),
  ],
};
