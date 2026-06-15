import type { Meta, StoryObj } from "@storybook/react-vite";
import KeywordRulesTemplate from "./KeywordRules.tsx";
import {
  sampleChannelGroups,
  samplePrograms,
  sampleServices,
} from "../../lib/fixtures.ts";
import { nowEpochMs } from "../../lib/datetime.ts";

const meta = {
  title: "templates/KeywordRules",
  component: KeywordRulesTemplate,
  parameters: { layout: "fullscreen" },
  args: {
    rules: [
      {
        id: "a",
        keyword: "ニュース",
        channels: [],
        genres: [0],
        enabled: true,
        createdAt: 3,
      },
      {
        id: "b",
        keyword: "サッカー",
        channels: ["25", "27"],
        genres: [],
        enabled: true,
        createdAt: 2,
      },
      {
        id: "c",
        keyword: "ドラマ",
        from: "2026-06-01",
        to: "2026-06-30",
        channels: [],
        genres: [3],
        enabled: false,
        createdAt: 1,
      },
    ],
    services: sampleServices,
    channels: sampleChannelGroups,
    programs: samplePrograms,
    currentEpochMs: nowEpochMs(),
    onAdd: () => {},
    onEdit: () => {},
    onToggle: () => {},
    onRemove: () => {},
    onBackToSettings: () => {},
    onOpenWatch: () => {},
    onBack: () => {},
  },
} satisfies Meta<typeof KeywordRulesTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** ルール未登録の空状態。 */
export const Empty: Story = { args: { rules: [] } };

/** 追加・更新・削除の処理中。 */
export const Busy: Story = { args: { busy: true } };
