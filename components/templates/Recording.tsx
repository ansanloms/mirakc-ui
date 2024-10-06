import type { ComponentProps } from "preact";
import { t } from "../../locales/i18n.ts";
import RecordingList from "../organisms/Recording/List.tsx";

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

export default function Recording(
  props: Props,
) {
  return (
    <div class={"container h-full mx-auto p-4"}>
      <section class={"flex flex-col gap-4"}>
        <p>
          {t("common.unit.subject", { "num": props.recordingSchedules.length })}
        </p>
        <RecordingList
          recordingSchedules={props.recordingSchedules}
          setRecordingSchedule={props.setRecordingSchedule}
        />
      </section>
    </div>
  );
}
