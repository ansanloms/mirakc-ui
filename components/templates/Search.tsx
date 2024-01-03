import type { ComponentProps, JSX } from "preact";
import SearchList from "../organisms/Search/List.tsx";
import * as datetime from "$std/datetime/mod.ts";
import { css } from "twind/css";

type Props = {
  query: string | undefined;
  setQuery: (query: string) => void;
  programs: ComponentProps<typeof SearchList>["programs"];
  recordingSchedules: ComponentProps<typeof SearchList>["recordingSchedules"];
  addRecordingSchedule: ComponentProps<
    typeof SearchList
  >["addRecordingSchedule"];
  removeRecordingSchedule: ComponentProps<
    typeof SearchList
  >["removeRecordingSchedule"];
};

const style = {
  detail: css`
width: 72vw;
height: 64vh;
overflow: auto;
`,
};

export default function Search(
  {
    query,
    programs,
    recordingSchedules,
    setQuery,
    addRecordingSchedule,
    removeRecordingSchedule,
  }: Props,
) {
  const handleSetQuery: JSX.GenericEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setQuery(event.currentTarget.value);
  };

  return (
    <>
      <div>
        <input
          type="text"
          value={query}
          onChange={handleSetQuery}
        />
      </div>
      <SearchList
        programs={programs}
        recordingSchedules={recordingSchedules}
        addRecordingSchedule={addRecordingSchedule}
        removeRecordingSchedule={removeRecordingSchedule}
      />
    </>
  );
}
