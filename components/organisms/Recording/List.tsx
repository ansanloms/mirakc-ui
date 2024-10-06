import type { ComponentProps } from "preact";
import RecordingDetail from "../../molecules/Recording/Detail.tsx";

type Props = {
  /**
   * 録画一覧。
   */
  recordingSchedules: (ComponentProps<
    typeof RecordingDetail
  >["recordingSchedule"])[];

  /**
   * 録画予約を選択する。
   */
  setRecordingSchedule: (
    recordingSchedule: ComponentProps<
      typeof RecordingDetail
    >["recordingSchedule"],
  ) => Promise<void>;
};

export default function RecordingList(
  props: Props,
) {
  return (
    <ul class={"grid gap-4"}>
      {props.recordingSchedules.map((recordingSchedule) => (
        <li
          class={"p-4 border-2 bg-gray-100 border-gray-400 rounded shadow-md"}
        >
          <RecordingDetail
            recordingSchedule={recordingSchedule}
            onClick={() => props.setRecordingSchedule(recordingSchedule)}
          />
        </li>
      ))}
    </ul>
  );
}
