import type { ComponentProps } from "preact";
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
   * 番組を選択する。
   */
  setProgram: (
    program: ComponentProps<
      typeof SearchDetail
    >["program"],
  ) => Promise<void>;
};

export default function SearchList(props: Props) {
  return (
    <ul class={"grid gap-4"}>
      {props.programs.map((program) => (
        <li
          class={"p-4 border-2 bg-gray-100 border-gray-400 rounded shadow-md"}
        >
          <SearchDetail
            program={program}
            recordingSchedule={props.recordingSchedules.find((
              recordingSchedule,
            ) => recordingSchedule.program.id === program.id)}
            onClick={() => {
              props.setProgram(program);
            }}
          />
        </li>
      ))}
    </ul>
  );
}
