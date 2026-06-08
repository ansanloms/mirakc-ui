import type { Meta, StoryObj } from "@storybook/react-vite";
import ChannelRow from "./ChannelRow.tsx";
import { samplePrograms, sampleServices } from "../../../lib/fixtures.ts";

const service = sampleServices[0];
// samplePrograms は service ごとに 3 番組 (前/放送中/次)。先頭サービスの中央=放送中。
const program = samplePrograms[1];
const nextProgram = samplePrograms[2];

const meta = {
  title: "molecules/Watch/ChannelRow",
  component: ChannelRow,
  args: {
    service,
    program,
    nextProgram,
    progress: 0.4,
    active: false,
    onSelect: () => {},
  },
  decorators: [
    (Story) => (
      <div style={{ width: "36rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChannelRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Active: Story = { args: { active: true } };
