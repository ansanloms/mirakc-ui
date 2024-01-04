import type { ComponentProps } from "preact";

import type { components } from "../../../hooks/api/schema.d.ts";
import RecordingDetail from "../../molecules/Recording/Detail.tsx";

type Props = {
  /**
   * 録画一覧。
   */
  recordingSchedules: (ComponentProps<
    typeof RecordingDetail
  >["recordingSchedule"])[];

  /**
   * 録画予約解除する。
   */
  removeRecordingSchedule: ComponentProps<
    typeof RecordingDetail
  >["removeRecordingSchedule"];

  /**
   * 更新中の対象。
   */
  loadings: (ComponentProps<
    typeof RecordingDetail
  >["recordingSchedule"]["program"]["id"])[];
};

export default function RecordingList(
  props: Props,
) {
  return (
    <ul class={["grid", "gap-4"]}>
      {props.recordingSchedules.map((recordingSchedule) => (
        <li
          class={[
            "p-4",
            "border-2",
            "bg-gray-100",
            "border-gray-400",
            "rounded",
            "shadow-md",
          ]}
        >
          <RecordingDetail
            recordingSchedule={recordingSchedule}
            removeRecordingSchedule={props.removeRecordingSchedule}
            loading={props.loadings.some((programId) =>
              recordingSchedule.program.id === programId
            )}
          />
        </li>
      ))}
    </ul>
  );
}
