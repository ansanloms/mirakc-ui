import type { ComponentProps } from "preact";

import type { components } from "../../../hooks/api/schema.d.ts";
import SearchDetail from "../../molecules/Search/Detail.tsx";

type Props = {
  /**
   * 番組一覧。
   */
  programs: (ComponentProps<
    typeof SearchDetail
  >["program"])[];

  /**
   * 録画一覧。
   */
  recordingSchedules: (
    ComponentProps<
      typeof SearchDetail
    >["recordingSchedule"]
  )[];

  /**
   * 録画予約する。
   */
  addRecordingSchedule: ComponentProps<
    typeof SearchDetail
  >["addRecordingSchedule"];

  /**
   * 録画予約解除する。
   */
  removeRecordingSchedule: ComponentProps<
    typeof SearchDetail
  >["removeRecordingSchedule"];

  /**
   * 更新中の対象。
   */
  loadings: (ComponentProps<
    typeof SearchDetail
  >["program"]["id"])[];
};

export default function SearchList(props: Props) {
  return (
    <ul class={["grid", "gap-4"]}>
      {props.programs.map((program) => (
        <li
          class={[
            "p-4",
            "border-2",
            "bg-gray-100",
            "border-gray-400",
            "rounded",
            "shadow-md",
          ]}
        >
          <SearchDetail
            program={program}
            recordingSchedule={props.recordingSchedules.find((
              recordingSchedule,
            ) => recordingSchedule.program.id === program.id)}
            addRecordingSchedule={props.addRecordingSchedule}
            removeRecordingSchedule={props.removeRecordingSchedule}
            loading={props.loadings.some((programId) =>
              program.id === programId
            )}
          />
        </li>
      ))}
    </ul>
  );
}
