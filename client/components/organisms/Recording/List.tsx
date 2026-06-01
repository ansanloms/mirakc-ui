import type { ComponentProps } from "react";
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
    <ul className={styles.list}>
      {props.recordingSchedules.map((recordingSchedule) => (
        <li key={recordingSchedule?.program.id} className={styles.item}>
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
