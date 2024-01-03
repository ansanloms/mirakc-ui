import type { ComponentProps } from "preact";

import type { components } from "../../../hooks/api/schema.d.ts";
import SearchDetail from "../../molecules/Search/Detail.tsx";

type Props = {
  programs: (ComponentProps<
    typeof SearchDetail
  >["program"])[];
  recordingSchedules: (
    ComponentProps<
      typeof SearchDetail
    >["recordingSchedule"]
  )[];
  addRecordingSchedule: ComponentProps<
    typeof SearchDetail
  >["addRecordingSchedule"];
  removeRecordingSchedule: ComponentProps<
    typeof SearchDetail
  >["removeRecordingSchedule"];
};

export default function RecordingList(
  {
    programs,
    recordingSchedules,
    addRecordingSchedule,
    removeRecordingSchedule,
  }: Props,
) {
  return (
    <ul class={["grid", "gap-4"]}>
      {programs.map((program) => (
        <li>
          <SearchDetail
            program={program}
            recordingSchedule={recordingSchedules.find((recordingSchedule) =>
              recordingSchedule.program.id === program.id
            )}
            addRecordingSchedule={addRecordingSchedule}
            removeRecordingSchedule={removeRecordingSchedule}
          />
        </li>
      ))}
    </ul>
  );
}
