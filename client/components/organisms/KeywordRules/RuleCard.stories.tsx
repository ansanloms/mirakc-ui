import type { Meta, StoryObj } from "@storybook/react-vite";
import RuleCard from "./RuleCard.tsx";
import { sampleServices } from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/KeywordRules/RuleCard",
  component: RuleCard,
  args: {
    rule: {
      id: "a",
      keyword: "サッカー",
      from: "2026-06-01",
      to: "2026-06-30",
      serviceIds: [3274001040],
      genres: [1],
      enabled: true,
      createdAt: 0,
    },
    services: sampleServices,
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
      serviceIds: [],
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
      serviceIds: [],
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
      serviceIds: [3273601024, 3274001040, 3274101048, 4100101000],
      genres: [],
      enabled: true,
      createdAt: 0,
    },
  },
};
