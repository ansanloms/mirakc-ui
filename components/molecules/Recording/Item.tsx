import type { components } from "../../../hooks/api/schema.d.ts";
import { t } from "../../../locales/i18n.ts";
import { css } from "twind/css";
import Icon from "../../atoms/Icon.tsx";

type Props = {
  recordingSchedule: components["schemas"]["WebRecordingSchedule"];
};

const style = {
  container: css`
grid-template-columns: auto 1fr;
`,
};

export default function RecordingItem(
  { recordingSchedule }: Props,
) {
  return (
    <dl class={[style.container, "text-xs", "grid", "gap-x-4", "gap-y-2"]}>
      <dt class="font-bold">
        {t("recording.status.label")}
      </dt>
      <dd>
        {t(`recording.status.state.${recordingSchedule.state}`)}
      </dd>
      <dt class="font-bold">
        {t("recording.saveFileName")}
      </dt>
      <dd class="font-mono">
        {recordingSchedule.options.contentPath}
      </dd>
      {recordingSchedule.failedReason && (
        <>
          <dt class="font-bold">
            {t("recording.failedReason.label")}
          </dt>
          <dd>
            {t(
              `recording.failedReason.type.${recordingSchedule.failedReason.type}`,
            )}
          </dd>
        </>
      )}
    </dl>
  );
}
