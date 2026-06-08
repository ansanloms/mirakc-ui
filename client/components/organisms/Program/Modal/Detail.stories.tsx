import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramModalDetail from "./Detail.tsx";
import {
  sampleProgram,
  sampleSchedules,
  sampleServices,
} from "../../../../lib/fixtures.ts";

const meta = {
  title: "organisms/Program/Modal/Detail",
  component: ProgramModalDetail,
  args: {
    open: true,
    program: sampleProgram,
    service: sampleServices[1],
    loading: false,
    addRecordingSchedule: () => {},
    removeRecordingSchedule: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof ProgramModalDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 未予約。録画予約ボタンを表示する。 */
export const Unreserved: Story = {};

/** 予約済 (scheduled)。録画予約を解除ボタンを表示する。 */
export const Reserved: Story = {
  args: { recordingSchedule: sampleSchedules[0] },
};

/** 録画済 (finished)。録画済バッジのみ表示する。 */
export const Recorded: Story = {
  args: { recordingSchedule: sampleSchedules[1] },
};

/** 更新中。録画予約ボタンを無効化する。 */
export const Loading: Story = {
  args: { loading: true },
};
