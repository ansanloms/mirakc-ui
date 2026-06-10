import type { Meta, StoryObj } from "@storybook/react-vite";
import KeywordRulesTemplate from "./KeywordRules.tsx";
import { samplePrograms, sampleServices } from "../../lib/fixtures.ts";
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
        serviceIds: [],
        genres: [0],
        enabled: true,
        createdAt: 3,
      },
      {
        id: "b",
        keyword: "サッカー",
        serviceIds: [3274001040, 3273601024],
        genres: [],
        enabled: true,
        createdAt: 2,
      },
      {
        id: "c",
        keyword: "ドラマ",
        from: "2026-06-01",
        to: "2026-06-30",
        serviceIds: [],
        genres: [3],
        enabled: false,
        createdAt: 1,
      },
    ],
    services: sampleServices,
    programs: samplePrograms,
    currentEpochMs: nowEpochMs(),
    onAdd: () => {},
    onEdit: () => {},
    onToggle: () => {},
    onRemove: () => {},
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
