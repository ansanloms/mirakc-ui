import type { components } from "../../lib/api/schema.d.ts";
import StatusBadge from "./StatusBadge.tsx";
import { scheduleStatusKind } from "../../lib/schedule.ts";

type RecordingScheduleState = components["schemas"]["RecordingScheduleState"];

type Props = {
  /** 録画スケジュールの状態。 */
  state: RecordingScheduleState;
};

/**
 * 録画スケジュールの state を 予約 / 録画中 / 失敗 / 録画済 のバッジで表示する。
 * state → 表示カテゴリのマッピングは scheduleStatusKind に集約している。
 */
export default function ScheduleStatusBadge({ state }: Props) {
  return <StatusBadge kind={scheduleStatusKind(state)} />;
}
