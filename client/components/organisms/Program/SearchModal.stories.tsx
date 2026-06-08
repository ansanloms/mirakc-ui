import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramSearchModal from "./SearchModal.tsx";
import {
  samplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/Program/SearchModal",
  component: ProgramSearchModal,
  args: {
    open: true,
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

/** 予約も録画もないデータ。 */
export const NoSchedules: Story = { args: { schedules: [] } };
