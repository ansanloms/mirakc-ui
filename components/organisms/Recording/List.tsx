import type { ComponentProps } from "preact";

import type { components } from "../../../hooks/api/schema.ts";
import RecordingDetail from "../../molecules/Recording/Detail.tsx";

type Props = {
  recordingSchedules: (ComponentProps<
    typeof RecordingDetail
  >["recordingSchedule"])[];
  removeRecordingSchedule: ComponentProps<
    typeof RecordingDetail
  >["removeRecordingSchedule"];
};

export default function RecordingList(
  { recordingSchedules, removeRecordingSchedule }: Props,
) {
  return (
    <ul
      class={[
        "grid",
        "gap-4",
      ]}
    >
      {recordingSchedules.map((recordingSchedule) => (
        <li>
          <RecordingDetail
            recordingSchedule={recordingSchedule}
            removeRecordingSchedule={removeRecordingSchedule}
          />
        </li>
      ))}
    </ul>
  );
}
