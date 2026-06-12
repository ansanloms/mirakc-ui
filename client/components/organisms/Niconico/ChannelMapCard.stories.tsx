import type { Meta, StoryObj } from "@storybook/react-vite";
import ChannelMapCard from "./ChannelMapCard.tsx";
import { sampleServices } from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/Niconico/ChannelMapCard",
  component: ChannelMapCard,
  args: {
    rows: [
      {
        key: 1,
        serviceId: sampleServices[0].id,
        nicoliveChannelId: "ch2646436",
      },
      {
        key: 2,
        serviceId: sampleServices[1].id,
        nicoliveChannelId: "ch2646437",
      },
      { key: 3, serviceId: null, nicoliveChannelId: "" },
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

/** 行が無い空状態。 */
export const Empty: Story = {
  args: { rows: [] },
};

/** 形式エラー + 重複エラー。 */
export const WithErrors: Story = {
  args: {
    rows: [
      { key: 1, serviceId: sampleServices[0].id, nicoliveChannelId: "jk1" },
      { key: 2, serviceId: sampleServices[1].id, nicoliveChannelId: "ch1" },
      { key: 3, serviceId: sampleServices[2].id, nicoliveChannelId: "ch1" },
    ],
    invalidCount: 1,
    duplicateIds: new Set(["ch1"]),
  },
};
