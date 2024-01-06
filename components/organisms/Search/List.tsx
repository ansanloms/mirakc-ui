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
          />
        </li>
      ))}
    </ul>
  );
}
