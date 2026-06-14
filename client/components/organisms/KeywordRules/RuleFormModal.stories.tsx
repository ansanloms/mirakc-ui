import type { Meta, StoryObj } from "@storybook/react-vite";
import RuleFormModal from "./RuleFormModal.tsx";
import { buildUpcoming } from "../../../lib/keyword-preview.ts";
import {
  sampleChannelGroups,
  samplePrograms,
  sampleServices,
} from "../../../lib/fixtures.ts";
import { nowEpochMs } from "../../../lib/datetime.ts";

const upcoming = buildUpcoming(samplePrograms, sampleServices, nowEpochMs());

const meta = {
  title: "organisms/KeywordRules/RuleFormModal",
  component: RuleFormModal,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    channels: sampleChannelGroups,
    upcoming,
    onSave: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof RuleFormModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 新規登録。 */
export const New: Story = {};

/** 既存ルールの編集。 */
export const Edit: Story = {
  args: {
    initial: {
      id: "a",
      keyword: "ニュース",
      from: "2026-06-01",
      to: "2026-06-30",
      channels: ["27", "BS15_0"],
      genres: [0],
      enabled: true,
      createdAt: 0,
    },
  },
};

/** 保存処理中。 */
export const Busy: Story = {
  args: {
    busy: true,
    initial: {
      id: "a",
      keyword: "ニュース",
      channels: [],
      genres: [],
      enabled: true,
      createdAt: 0,
    },
  },
};
