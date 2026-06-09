import type { components } from "../../lib/api/schema.d.ts";
import { t } from "../../locales/i18n.ts";
import styles from "./RecordingStatusBadge.module.css";

type RecordingScheduleState = components["schemas"]["RecordingScheduleState"];

type Props = {
  /** 録画スケジュールの状態 (mirakc API の RecordingScheduleState)。 */
  state: RecordingScheduleState;
};

/**
 * 録画スケジュールの状態 (録画予約 / 録画中 / 録画失敗 / 録画済) を表すバッジ。
 * 文言・配色とも state ごとに直接引く (scheduled/tracking などの重複は許容)。
 */
export default function RecordingStatusBadge({ state }: Props) {
  return (
    <span className={`${styles.badge} ${styles[state]}`}>
      {state === "recording" && <span className={styles.dot} />}
      {t(`program.recordingStatus.${state}`)}
    </span>
  );
}
