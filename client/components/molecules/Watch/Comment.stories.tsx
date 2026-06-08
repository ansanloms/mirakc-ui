import type { Meta, StoryObj } from "@storybook/react-vite";
import Comment from "./Comment.tsx";
import type { LiveComment } from "../../../lib/live-comment.ts";

const sample: LiveComment = {
  id: "1",
  name: "視聴者A",
  colorHue: 210,
  text: "おもしろい",
  time: "21:03",
  me: false,
};

const meta = {
  title: "molecules/Watch/Comment",
  component: Comment,
  args: { comment: sample },
} satisfies Meta<typeof Comment>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Mine: Story = {
  args: {
    comment: {
      id: "2",
      name: "あなた",
      colorHue: 210,
      text: "わかる、それな",
      time: "21:04",
      me: true,
    },
  },
};
