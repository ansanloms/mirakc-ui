import type { ComponentProps } from "preact";

import RecordingList from "../organisms/Recording/List.tsx";

type Props = {
  recordingSchedules: ComponentProps<
    typeof RecordingList
  >["recordingSchedules"];
  removeRecordingSchedules: ComponentProps<
    typeof RecordingList
  >["removeRecordingSchedules"];
};

export default function Program(
  { recordingSchedules, removeRecordingSchedule }: Props,
) {
  return (
    <div class={["container", "mx-auto", "px-4", "mt-4", "mb-6"]}>
      <section class={["grid", "w-full", "h-full"]}>
        <RecordingList
          recordingSchedules={recordingSchedules}
          removeRecordingSchedule={removeRecordingSchedule}
        />
      </section>
    </div>
  );
}
