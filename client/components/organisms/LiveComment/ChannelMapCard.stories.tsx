import type { Meta, StoryObj } from "@storybook/react-vite";
import ChannelMapCard from "./ChannelMapCard.tsx";
import { sampleServices } from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/LiveComment/ChannelMapCard",
  component: ChannelMapCard,
  args: {
    source: "nicolive",
    rows: [
      {
        key: 1,
        serviceId: sampleServices[0].id,
        channelId: "ch2646436",
        enabled: true,
      },
      {
        key: 2,
        serviceId: sampleServices[1].id,
        channelId: "ch2646437",
        enabled: false,
      },
      { key: 3, serviceId: null, channelId: "", enabled: true },
    ],
    services: sampleServices,
    duplicateIds: new Set<string>(),
    invalidCount: 0,
    onChangeRow: () => {},
    onAddRow: () => {},
    onRemoveRow: () => {},
  },
} satisfies Meta<typeof ChannelMapCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** NX-Jikkyo (jk 形式)。 */
export const NxJikkyo: Story = {
  args: {
    source: "nx-jikkyo",
    rows: [
      {
        key: 1,
        serviceId: sampleServices[0].id,
        channelId: "jk1",
        enabled: true,
      },
    ],
  },
};

/** 空状態。 */
export const Empty: Story = {
  args: { rows: [] },
};

/** 形式エラー + 重複エラー。 */
export const WithErrors: Story = {
  args: {
    rows: [
      {
        key: 1,
        serviceId: sampleServices[0].id,
        channelId: "jk1",
        enabled: true,
      },
      {
        key: 2,
        serviceId: sampleServices[1].id,
        channelId: "ch1",
        enabled: true,
      },
      {
        key: 3,
        serviceId: sampleServices[2].id,
        channelId: "ch1",
        enabled: true,
      },
    ],
    invalidCount: 1,
    duplicateIds: new Set(["ch1"]),
  },
};
