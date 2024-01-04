import type { components } from "../../../hooks/api/schema.d.ts";
import { t } from "../../../locales/i18n.ts";

type Props = {
  /**
   * 録画予約。
   */
  recordingSchedule: components["schemas"]["WebRecordingSchedule"];
};

export default function RecordingItem(props: Props) {
  return (
    <dl class={["grid", "gap-1"]}>
      <dt class={["font-bold", "text-sm"]}>
        {t("recording.status.label")}
      </dt>
      <dd class={["ml-4", "text-sm"]}>
        {t(`recording.status.state.${props.recordingSchedule.state}`)}
      </dd>
      <dt class={["font-bold", "text-sm"]}>
        {t("recording.saveFileName")}
      </dt>
      <dd class={["ml-4", "text-sm"]}>
        {props.recordingSchedule.options.contentPath}
      </dd>
      {props.recordingSchedule.failedReason && (
        <>
          <dt class={["font-bold", "text-sm"]}>
            {t("recording.failedReason.label")}
          </dt>
          <dd class={["ml-4", "text-sm"]}>
            {t(
              `recording.failedReason.type.${props.recordingSchedule.failedReason.type}`,
            )}
          </dd>
        </>
      )}
    </dl>
  );
}
