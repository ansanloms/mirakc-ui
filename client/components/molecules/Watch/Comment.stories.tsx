import type { Meta, StoryObj } from "@storybook/react-vite";
import Comment from "./Comment.tsx";
import { sampleLiveComments } from "../../../lib/fixtures.ts";

const meta = {
  title: "molecules/Watch/Comment",
  component: Comment,
  args: { comment: sampleLiveComments[0] },
} satisfies Meta<typeof Comment>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 他人のコメント。 */
export const Default: Story = {};

/** 自分のコメント (me=true)。 */
export const Mine: Story = {
  args: { comment: sampleLiveComments[3] },
};
