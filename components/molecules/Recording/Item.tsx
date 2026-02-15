import type { components } from "../../../hooks/api/schema.d.ts";
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
    <dl class={styles.list}>
      <dt class={styles.term}>
        {t("recording.status.label")}
      </dt>
      <dd class={styles.definition}>
        {t(`recording.status.state.${props.recordingSchedule.state}`)}
      </dd>
      <dt class={styles.term}>
        {t("recording.saveFileName")}
      </dt>
      <dd class={styles.definition}>
        {props.recordingSchedule.options.contentPath}
      </dd>
      {props.recordingSchedule.failedReason && (
        <>
          <dt class={styles.term}>
            {t("recording.failedReason.label")}
          </dt>
          <dd class={styles.definition}>
            {t(
              `recording.failedReason.type.${props.recordingSchedule.failedReason.type}`,
            )}
          </dd>
        </>
      )}
    </dl>
  );
}
