import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramModalDetail from "./Detail.tsx";
import { withRouter } from "../../../../lib/storybook.tsx";
import { nowEpochMs } from "../../../../lib/datetime.ts";
import {
  sampleProgram,
  sampleSchedules,
  sampleServices,
} from "../../../../lib/fixtures.ts";

const HOUR = 60 * 60 * 1000;
const now = nowEpochMs();

// 放送状態ごとのサンプル番組 (sampleProgram の時刻だけ差し替える)。
const upcoming = {
  ...sampleProgram,
  id: 9001,
  startAt: now + HOUR,
  duration: HOUR,
};
const airing = {
  ...sampleProgram,
  id: 9002,
  startAt: now - 20 * 60 * 1000,
  duration: HOUR,
};
const ended = {
  ...sampleProgram,
  id: 9003,
  startAt: now - 3 * HOUR,
  duration: HOUR,
};

const meta = {
  title: "organisms/Program/Modal/Detail",
  component: ProgramModalDetail,
  decorators: [withRouter],
  args: {
    open: true,
    program: upcoming,
    service: sampleServices[0],
    loading: false,
    addRecordingSchedule: () => {},
    removeRecordingSchedule: () => {},
    onClose: () => {},
  },
} satisfies Meta<typeof ProgramModalDetail>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 未開始・未予約。録画予約ボタンを表示する。 */
export const Upcoming: Story = {};

/** 未開始・予約済。録画予約を解除ボタンを表示する。 */
export const Reserved: Story = {
  args: { recordingSchedule: sampleSchedules[0] },
};

/** 放送中。視聴するボタンを表示する (録画予約は出さない)。 */
export const Airing: Story = { args: { program: airing } };

/** 終了。操作ボタンを出さず、閉じるのみ全幅で表示する。 */
export const Ended: Story = { args: { program: ended } };

/** 録画済 (finished)。タグ行に録画済バッジを出し、フッターは閉じるのみ。 */
export const Recorded: Story = {
  args: { program: ended, recordingSchedule: sampleSchedules[1] },
};

/** 更新中。録画予約ボタンを無効化する。 */
export const Loading: Story = { args: { loading: true } };
