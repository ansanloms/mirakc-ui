import type { components } from "../../lib/api/schema.d.ts";
import { recordingStatusKind } from "../../lib/schedule.ts";
import { t } from "../../locales/i18n.ts";
import styles from "./RecordingStatusBadge.module.css";

type RecordingScheduleState = components["schemas"]["RecordingScheduleState"];

type Props = {
  /** 録画スケジュールの状態 (mirakc API の RecordingScheduleState)。 */
  state: RecordingScheduleState;
};

const LABEL_KEY = {
  reserved: "program.badge.reserved",
  recording: "program.badge.recording",
  failed: "program.badge.failed",
  recorded: "program.badge.recorded",
} as const;

/** 録画スケジュールの状態 (録画予約 / 録画中 / 録画失敗 / 録画済) を表すバッジ。 */
export default function RecordingStatusBadge({ state }: Props) {
  const kind = recordingStatusKind(state);
  return (
    <span className={`${styles.badge} ${styles[kind]}`}>
      {kind === "recording" && <span className={styles.dot} />}
      {t(LABEL_KEY[kind])}
    </span>
  );
}
