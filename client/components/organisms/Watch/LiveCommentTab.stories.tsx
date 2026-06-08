import type { Meta, StoryObj } from "@storybook/react-vite";
import LiveCommentTab from "./LiveCommentTab.tsx";
import type { LiveComment } from "../../../lib/live-comment.ts";

const sampleComments: LiveComment[] = [
  {
    id: "1",
    name: "視聴者A",
    colorHue: 210,
    text: "始まった",
    time: "21:00",
    me: false,
  },
  {
    id: "2",
    name: "視聴者B",
    colorHue: 30,
    text: "今日のゲスト豪華だな",
    time: "21:01",
    me: false,
  },
  {
    id: "3",
    name: "視聴者C",
    colorHue: 150,
    text: "ここ好き",
    time: "21:02",
    me: false,
  },
  {
    id: "4",
    name: "あなた",
    colorHue: 210,
    text: "わかる",
    time: "21:02",
    me: true,
  },
  {
    id: "5",
    name: "視聴者D",
    colorHue: 300,
    text: "次の展開気になる",
    time: "21:03",
    me: false,
  },
];

const meta = {
  title: "organisms/Watch/LiveCommentTab",
  component: LiveCommentTab,
  args: {
    comments: sampleComments,
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
