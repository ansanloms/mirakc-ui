import type { ComponentProps } from "preact";
import { t } from "../../locales/i18n.ts";
import RecordingList from "../organisms/Recording/List.tsx";
import styles from "./Recording.module.css";

type Props = {
  /**
   * 録画一覧。
   */
  recordingSchedules: ComponentProps<
    typeof RecordingList
  >["recordingSchedules"];

  /**
   * 録画予約を選択する。
   */
  setRecordingSchedule: ComponentProps<
    typeof RecordingList
  >["setRecordingSchedule"];
};

export default function Recording(props: Props) {
  return (
    <div class={styles.container}>
      <section class={styles.section}>
        <p>
          {t("common.unit.subject", {
            "num": props.recordingSchedules.length,
          })}
        </p>
        <RecordingList
          recordingSchedules={props.recordingSchedules}
          setRecordingSchedule={props.setRecordingSchedule}
        />
      </section>
    </div>
  );
}
