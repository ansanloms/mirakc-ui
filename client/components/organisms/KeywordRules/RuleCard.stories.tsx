import type { Meta, StoryObj } from "@storybook/react-vite";
import RuleCard from "./RuleCard.tsx";
import { sampleChannelGroups } from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/KeywordRules/RuleCard",
  component: RuleCard,
  args: {
    rule: {
      id: "a",
      keyword: "サッカー",
      from: "2026-06-01",
      to: "2026-06-30",
      channels: ["25"],
      genres: [1],
      enabled: true,
      createdAt: 0,
    },
    channels: sampleChannelGroups,
    matchCount: 4,
    onToggle: () => {},
    onEdit: () => {},
    onRemove: () => {},
  },
} satisfies Meta<typeof RuleCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 条件なし (すべてのチャンネル・ジャンルが対象)。 */
export const NoConditions: Story = {
  args: {
    rule: {
      id: "b",
      keyword: "ニュース",
      channels: [],
      genres: [],
      enabled: true,
      createdAt: 0,
    },
  },
};

/** 停止中。 */
export const Disabled: Story = {
  args: {
    rule: {
      id: "c",
      keyword: "ドラマ",
      channels: [],
      genres: [3],
      enabled: false,
      createdAt: 0,
    },
  },
};

/** 一致 0 件。 */
export const ZeroMatches: Story = { args: { matchCount: 0 } };

/** 複数チャンネル指定。 */
export const MultipleChannels: Story = {
  args: {
    rule: {
      id: "d",
      keyword: "クイズ",
      channels: ["27", "25", "24", "BS15_0"],
      genres: [],
      enabled: true,
      createdAt: 0,
    },
  },
};
