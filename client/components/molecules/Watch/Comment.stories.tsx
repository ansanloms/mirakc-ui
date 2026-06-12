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

/** 匿名 (name 空)。実況のコメントは大半がこれ。 */
export const Anonymous: Story = {
  args: { comment: { ...sampleLiveComments[0], name: "" } },
};

/** 長文。折り返しは本文領域に収まり、時刻列を巻き込まない。 */
export const LongText: Story = {
  args: {
    comment: {
      ...sampleLiveComments[0],
      name: "",
      text:
        "これはとても長い実況コメントの例で、コメント領域の幅を超えて複数行に折り返されるが、時刻表示の列は固定のまま崩れないことを確認するためのテキスト。",
    },
  },
};
