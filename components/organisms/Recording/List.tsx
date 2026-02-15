import type { ComponentProps } from "preact";
import RecordingDetail from "../../molecules/Recording/Detail.tsx";
import styles from "./List.module.css";

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
  ) => void;
};

export default function RecordingList(props: Props) {
  return (
    <ul class={styles.list}>
      {props.recordingSchedules.map((recordingSchedule) => (
        <li class={styles.item}>
          <RecordingDetail
            recordingSchedule={recordingSchedule}
            onClick={() =>
              props.setRecordingSchedule(recordingSchedule)}
          />
        </li>
      ))}
    </ul>
  );
}
