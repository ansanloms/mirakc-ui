import type { ComponentProps, JSX } from "preact";
import SearchList from "../organisms/Search/List.tsx";
import SearchFormQuery from "../organisms/Search/Form/Query.tsx";
import * as datetime from "$std/datetime/mod.ts";
import { css } from "twind/css";

type Props = {
  /**
   * 検索値。
   */
  query: string | undefined;

  /**
   * 検索値の更新。
   */
  setQuery: (query: string | undefined) => void;

  /**
   * 番組一覧。
   */
  programs: ComponentProps<typeof SearchList>["programs"];

  /**
   * 録画一覧。
   */
  recordingSchedules: ComponentProps<typeof SearchList>["recordingSchedules"];

  /**
   * 録画登録する。
   */
  addRecordingSchedule: ComponentProps<
    typeof SearchList
  >["addRecordingSchedule"];

  /**
   * 録画登録解除する。
   */
  removeRecordingSchedule: ComponentProps<
    typeof SearchList
  >["removeRecordingSchedule"];

  /**
   * 更新中の対象。
   */
  loadings: ComponentProps<
    typeof SearchList
  >["loadings"];
};

const style = {
  detail: css`
width: 72vw;
height: 64vh;
overflow: auto;
`,
};

export default function Search(props: Props) {
  const handleSetQuery = (query: Props["query"]) => {
    props.setQuery(query);
  };

  return (
    <div
      class={["container", "mx-auto", "px-4", "mt-4", "mb-6", "grid", "gap-4"]}
    >
      <SearchFormQuery
        inputs={{ query: props.query }}
        onChange={({ query }) => handleSetQuery(query)}
      />
      <SearchList
        programs={props.programs}
        recordingSchedules={props.recordingSchedules}
        addRecordingSchedule={props.addRecordingSchedule}
        removeRecordingSchedule={props.removeRecordingSchedule}
        loadings={props.loadings}
      />
    </div>
  );
}
