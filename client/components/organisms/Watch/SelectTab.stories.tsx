import type { Meta, StoryObj } from "@storybook/react-vite";
import SelectTab, { type ChannelEntry } from "./SelectTab.tsx";
import { samplePrograms, sampleServices } from "../../../lib/fixtures.ts";

// 各サービスの番組 (id = service.id * 10 + i) から放送中 (i=1) / 次 (i=2) を組む。
const channels: ChannelEntry[] = sampleServices
  .filter((service) => service.channel.type === "GR")
  .map((service) => ({
    service,
    program: samplePrograms.find((p) => p.id === service.id * 10 + 1),
    nextProgram: samplePrograms.find((p) => p.id === service.id * 10 + 2),
    progress: 0.45,
  }));

const meta = {
  title: "organisms/Watch/SelectTab",
  component: SelectTab,
  args: {
    band: "GR",
    onChangeBand: () => {},
    channels,
    activeServiceId: channels[0]?.service.id,
    onSelect: () => {},
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "39rem",
          height: "50rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
