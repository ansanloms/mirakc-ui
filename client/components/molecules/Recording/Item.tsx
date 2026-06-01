import type { components } from "../../../lib/api/schema.d.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./Item.module.css";

type Props = {
  /**
   * 録画予約。
   */
  recordingSchedule: components["schemas"]["WebRecordingSchedule"];
};

export default function RecordingItem(props: Props) {
  return (
    <dl className={styles.list}>
      <dt className={styles.term}>
        {t("recording.status.label")}
      </dt>
      <dd className={styles.definition}>
        {t(`recording.status.state.${props.recordingSchedule.state}`)}
      </dd>
      <dt className={styles.term}>
        {t("recording.saveFileName")}
      </dt>
      <dd className={styles.definition}>
        {props.recordingSchedule.options.contentPath}
      </dd>
      {props.recordingSchedule.failedReason && (
        <>
          <dt className={styles.term}>
            {t("recording.failedReason.label")}
          </dt>
          <dd className={styles.definition}>
            {t(
              `recording.failedReason.type.${props.recordingSchedule.failedReason.type}`,
            )}
          </dd>
        </>
      )}
    </dl>
  );
}
