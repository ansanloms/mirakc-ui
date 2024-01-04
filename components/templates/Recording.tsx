import type { ComponentProps } from "preact";

import RecordingList from "../organisms/Recording/List.tsx";

type Props = {
  /**
   * 録画一覧。
   */
  recordingSchedules: ComponentProps<
    typeof RecordingList
  >["recordingSchedules"];

  /**
   * 録画予約解除する。
   */
  removeRecordingSchedule: ComponentProps<
    typeof RecordingList
  >["removeRecordingSchedule"];

  /**
   * 更新中の対象。
   */
  loadings: ComponentProps<
    typeof RecordingList
  >["loadings"];
};

export default function Recording(
  props: Props,
) {
  return (
    <div class={["container", "mx-auto", "px-4", "mt-4", "mb-6"]}>
      <section class={["grid", "w-full", "h-full"]}>
        <RecordingList
          recordingSchedules={props.recordingSchedules}
          removeRecordingSchedule={props.removeRecordingSchedule}
          loadings={props.loadings}
        />
      </section>
    </div>
  );
}
