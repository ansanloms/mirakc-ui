import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramSearchModal, { type FilterId } from "./SearchModal.tsx";
import {
  samplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/Program/SearchModal",
  component: ProgramSearchModal,
  // query / filter は controlled なので、story 側で状態を保持して操作を確認できる
  // ようにする。
  render: (args) => {
    const [query, setQuery] = useState(args.query ?? "");
    const [filter, setFilter] = useState<FilterId>(args.filter ?? "all");
    return (
      <ProgramSearchModal
        {...args}
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
      />
    );
  },
  args: {
    open: true,
    query: "",
    onQueryChange: () => {},
    filter: "all",
    onFilterChange: () => {},
    programs: samplePrograms,
    services: sampleServices,
    schedules: sampleSchedules,
    onClose: () => {},
    onPick: () => {},
  },
} satisfies Meta<typeof ProgramSearchModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 初期表示 (全て タブ・キーワード未入力)。入力促しを表示する。 */
export const Default: Story = {};

/** 録画予約タブを選択した状態。 */
export const Reserved: Story = { args: { filter: "reserved" } };

/** 予約も録画もないデータ。 */
export const NoSchedules: Story = { args: { schedules: [] } };
